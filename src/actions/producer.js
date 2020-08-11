// @flow
import R from 'ramda';
import moment from 'moment';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import {
  setInfo,
  setBlockUserAlert,
  setCameraError,
  setError,
  resetAlert,
  setExtensionError,
} from './alert';
import { getEvent, getAdminCredentials, getEventWithCredentials } from '../services/api';
import { tagSubscriberElements, isFan, isUserOnStage, fanTypeForActiveFan } from '../services/util';
import firebase from '../services/firebase';
import {
  Analytics,
  logVariation,
  logAction,
} from '../services/logging';
import opentok from '../services/opentok';
import { createSharedFile } from './files';
import {
  setBroadcastEventStatus,
  setBroadcastEventShowStarted,
  startElapsedTime,
  stopElapsedTime,
  setBroadcastState,
  updateParticipants,
  updateStageCountdown,
  setBroadcastEvent,
  setReconnecting,
  setReconnected,
  setDisconnected,
  setPrivateCall,
  onChatMessage,
  monitorScreen,
  monitorVolume,
  startCountdown,
  startFanTransition,
  stopFanTransition,
  startHeartBeat,
  stopHeartBeat,
  heartBeatTime,
} from './broadcast';
import { connectToUniversalChat, connectToFanChats } from './universalChat';

let analytics;
let activeBroadcastRef;
const { disconnect, signal, createEmptyPublisher, publishAudio } = opentok;

const notStarted = R.propEq('status', 'notStarted');
const isLive = R.propEq('status', 'live');
const setStatus = { status: (s: EventStatus): EventStatus => s === 'notStarted' ? 'preshow' : s };


/**
 * Start (or resume) a chat session with an on-stage participant
 */
const chatWithParticipant: ThunkActionCreator = (participantType: ParticipantType): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = participantType;
    const { broadcast } = getState();
    const existingChat = R.path(['chats', chatId], broadcast);
    const participant = R.path(['participants', participantType], broadcast);
    const connection = R.path(['stream', 'connection'], participant);
    const fromId = R.pathOr(null, ['currentUser', 'id'], getState());

    if (existingChat) {
      dispatch({ type: 'DISPLAY_CHAT', chatId, display: true });
    } else {
      dispatch({
        type: 'START_NEW_PARTICIPANT_CHAT',
        participantType,
        fromId,
        displayed: true,
        participant: R.assoc('connection', connection, participant),
      });
    }
  };

const onSignal = (dispatch: Dispatch, getState: GetState): SignalListener =>
  async ({ type, data, from }: Signal): AsyncVoid => {
    const signalData = data ? JSON.parse(data) : {};
    const signalType = R.last(R.split(':', type));
    const fromData = JSON.parse(from.data);
    const fromProducer = fromData.userType === 'producer';
    const userType = 'producer';
    const event: BroadcastEvent = R.path(['broadcast', 'event'], getState());
    const { domainId, fanUrl, producerHost } = event;

    switch (signalType) {
      case 'chatMessage': {
        const { fromType, fromId } = signalData;
        const chatId = isFan(fromType) ? fromId : fromType;
        const actions = [
          chatWithParticipant(chatId),
          onChatMessage(chatId),
          { type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, signalData) },
        ];
        R.forEach(dispatch, actions);
        if (signalData.isFile) {
          dispatch(createSharedFile(signalData));
        }
        break;
      }
      case 'startScreenShare': {
        if (fromProducer) {
          const broadcast = R.path(['broadcast'], getState());
          const producer = R.path(['participants', 'producer'], broadcast);
          const to = R.path(['stream', 'connection'], producer);
          const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/screen`);

          opentok.startScreenShare('stage').then(() => {
            ref.set(userType);
            ref.onDisconnect().remove();
          }).catch(() => {
            opentok.signal('stage', { type: 'errorScreenShareExtension', to });
            dispatch(setExtensionError());
            ref.remove();
          });
        }
        dispatch(setBroadcastState(opentok.state('stage')));
        break;
      }
      case 'endScreenShare': {
        fromProducer && await opentok.endScreenShare('stage');
        const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/screen`);
        ref.remove();
        break;
      }
      case 'videoOnOff':
        fromProducer && opentok.toggleLocalVideo('stage', signalData.video === 'on');
        break;
      case 'muteAudio':
        fromProducer && opentok.toggleLocalAudio('stage', signalData.mute === 'off');
        break;
      case 'changeVolume':
        fromProducer && opentok.changeVolume('stage', signalData.userType, signalData.volume);
        break;
      case 'errorScreenShareExtension':
        !producerHost && dispatch(setError('The user has no desktop sharing extension installed'));
        break;
      default:
        break;
    }
  };

const restoreVolume = (domainId: string, fanUrl: string, userType: UserRole) => {
  try {
    const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/volume/${userType}`);
    ref.set(100);
  } catch (error) {
    console.log(error);
  }
};

const opentokConfig = (dispatch: Dispatch, getState: GetState, userCredentials: UserCredentials, autoPublish: boolean): CoreInstanceOptions[] => {

  // Set common listeners for all user types here
  const eventListeners: CoreInstanceListener = (instance: Core) => {

    // Assign listener for state changes
    const subscribeEvents: SubscribeEventType[] = [
      'startScreenShare',
      'endScreenShare',
      'startCall',
      'subscribeToScreen',
      'subscribeToCamera',
      'unsubscribeFromCamera',
      'unsubscribeFromScreen',
    ];

    const handleSubscribeEvent = (state: CoreState, eventType: SubscribeEventType) => {
      dispatch(setBroadcastState(state));
      tagSubscriberElements(state, eventType);

      const stream = R.path(['publisher', 'stream'], state);
      const userType = stream && opentok.getStreamUserType(stream);
      dispatch(updateParticipants(userType, eventType, stream, true));
    };
    R.forEach((event: SubscribeEventType): void => instance.on(event, handleSubscribeEvent), subscribeEvents);

    // Assign listener for stream changes
    const otStreamEvents: StreamEventType[] = ['streamCreated', 'streamDestroyed'];
    const handleStreamEvent: StreamEventHandler = ({ type, stream }: OTStreamEvent) => {
      const isStage = R.propEq('name', 'stage', instance);
      const backstageFanLeft = type === 'streamDestroyed' && !isStage;
      const userType = opentok.getStreamUserType(stream);

      isStage && dispatch(updateParticipants(userType, type, stream, true));
      backstageFanLeft && dispatch(updateParticipants(userType, 'backstageFanLeft', stream, true));
    };

    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);

    // Assign signal listener
    instance.on('screenSharingError', (error: Error) => {
      if (error.code === 1500) {
        const event = R.path(['broadcast', 'event'], getState());
        const { domainId, fanUrl } = event;
        const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/screen`);
        ref.remove();
      }
    });
    instance.on('signal', onSignal(dispatch, getState));

    // Assign reconnection event listeners
    instance.on('sessionReconnecting', (): void => dispatch(setReconnecting()));
    instance.on('sessionReconnected', (): void => dispatch(setReconnected()));
    instance.on('sessionDisconnected', (): void => dispatch(setDisconnected()));
  };

  const coreOptions = (name: string, credentials: SessionCredentials, publisherRole: UserRole, autoSubscribe: boolean = true): CoreOptions => ({
    name,
    credentials,
    streamContainers(pubSub: PubSub, source: VideoType, data: { userType: UserRole }, stream?: Stream): string {
      const { broadcast } = getState();
      const privateCall = R.defaultTo({})(broadcast.privateCall);
      if (R.propEq('isWith', 'activeFan', privateCall)) {
        const getStreamId = R.prop('streamId');
        const fan = R.path(['activeFans', 'map', R.prop('fanId', privateCall)], broadcast);
        if (R.equals(getStreamId(fan), getStreamId(stream || {}))) {
          return `#videoActiveFan${fan.id}`;
        }
      }
      return `#video${pubSub === 'subscriber' ? data.userType : publisherRole}`;
    },
    communication: {
      autoSubscribe,
      callProperties: {
        fitMode: 'contain',
      },
    },
    controlsContainer: null,
    largeScale: true,
  });

  const stage = (): CoreInstanceOptions => {
    const { apiKey, stageSessionId, stageToken } = userCredentials;
    analytics = new Analytics(window.location.origin, stageSessionId, null, apiKey);
    const credentials = {
      apiKey,
      sessionId: stageSessionId,
      token: stageToken,
    };
    return {
      name: 'stage',
      coreOptions: coreOptions('stage', credentials, 'producer'),
      eventListeners,
      opentokOptions: { autoPublish },
    };
  };

  const backstage = (): CoreInstanceOptions => {
    const { apiKey, sessionId, backstageToken } = userCredentials;
    const credentials = {
      apiKey,
      sessionId,
      token: backstageToken,
    };
    return {
      name: 'backstage',
      coreOptions: coreOptions('backstage', credentials, 'producer', false),
      eventListeners,
    };
  };

  return [stage(), backstage()];
};

/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator = (userCredentials: UserCredentials, autoPublish: boolean): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const instances: CoreInstanceOptions[] = opentokConfig(dispatch, getState, userCredentials, autoPublish);
    try {
      opentok.init(instances);
    } catch (error) {
      const options = (): AlertPartialOptions => ({
        title: 'Error',
        text: "There's an error with your Opentok credentials. Please check your credentials and try again.",
        showConfirmButton: true,
        html: true,
        type: 'error',
        allowEscapeKey: false,
        onConfirm: () => {
          browserHistory.push('/admin');
          dispatch(resetAlert());
        },
      });
      dispatch(setInfo(options()));
    }

    try {
      analytics.log(logAction.producerConnects, logVariation.attempt);
      dispatch(monitorScreen(true));
      const hasScreen = await activeBroadcastRef.child('screen').once('value');
      await opentok.connect(['backstage', 'stage'], !!hasScreen.val());
      analytics.log(logAction.producerConnects, logVariation.success);
      dispatch(setBroadcastState(opentok.state('stage')));
      dispatch(monitorVolume());
      dispatch(startHeartBeat('producer'));
    } catch (error) {
      analytics.log(logAction.producerConnects, logVariation.fail);
    }
  };

const setBroadcastEventWithCredentials: ThunkActionCreator = (domainId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = R.assoc(`${userType}Url`, slug, { domainId, userType });
      const eventData: HostCelebEventData = await getEventWithCredentials(data, R.path(['auth', 'authToken'], getState()));
      dispatch(setBroadcastEvent(eventData));
    } catch (error) {
      console.log(error);
    }
  };

/**
 * Start (or resume) a chat session with a fan
 */
const chatWithActiveFan: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = fan.fanId;
    const existingChat = R.path(['broadcast', 'chats', chatId], getState());
    const fromId = R.path(['currentUser', 'id'], getState());
    if (existingChat) {
      const actions = [
        { type: 'DISPLAY_CHAT', chatId, display: true },
        { type: 'MINIMIZE_CHAT', chatId, minimize: false },
      ];
      R.forEach(dispatch, actions);
    } else {
      const toType = fanTypeForActiveFan(fan);
      // const connection = opentok.getConnection('backstage', fan.streamId, 'backstageFan');
      dispatch({ type: 'START_NEW_FAN_CHAT', fromId, fan, toType, display: true });
    }
  };

/**
 * End the active private call and update firebase, redux stores
 */
const endPrivateCall: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const { broadcast } = getState();
    const privateCall = R.prop('privateCall', broadcast) || {};
    const { domainId, fanUrl } = R.prop('event', broadcast);
    const fanId = R.propOr(null, 'fanId', privateCall);
    const isWithFan = !!fanId;
    const baseRef = `activeBroadcasts/${domainId}/${fanUrl}`;

    // Update fan record in firebase
    try {
      // Update fan record
      if (isWithFan) {
        const fanRef = firebase.database().ref(`${baseRef}/activeFans/${fanId}`);
        const fanRecord = await fanRef.once('value');
        if (fanRecord.val()) {
          await fanRef.update({ inPrivateCall: false });
        }
      }
    } catch (error) {
      // Nothing to do here. If the fan is no longer active and there is no record, that's fine
    }

    // Update broadcast record in firebase
    try {
      await activeBroadcastRef.update({ privateCall: null });
    } catch (error) {
      console.log('Failed to update active broadcast record in firebase', error);
    }

    // Update audio/video subscriptions
    try {
      const { isWith } = privateCall;
      // Stop publishing audio to backstage and start subscribing again to stage
      const fanStream = (): Stream => opentok.getStreamById('backstage', R.path(['map', fanId, 'streamId'], broadcast.activeFans));

      const chatId = isWithFan ? fanId : isWith;
      if (R.path(['chats', chatId], broadcast)) {
        dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId, property: 'inPrivateCall', update: false });
      }

      // Unsubscribe from backstage stream, if needed
      const backstageAction = () => {
        if (R.propEq('isWith', 'activeFan', privateCall)) {
          // Stop subscribing to active fan
          opentok.unsubscribe('backstage', fanStream());
        } else if (R.propEq('isWith', 'backstageFan', privateCall)) {
          // Stop subscribing to backstage fan audio
          opentok.unsubscribeFromAudio('backstage', fanStream());
        }
      };
      backstageAction();
    } catch (error) {
      // Nothing to do here if there is no stream
    }

    const instance = isUserOnStage(R.prop('isWith', privateCall)) ? 'stage' : 'backstage';
    try {
      await Promise.all([opentok.publishAudio(instance, false), opentok.subscribeAll('stage', true)]);
    } catch (error) {
      console.log(`Failed to publish audio to ${instance} or subscribe to stage`, error);
    }

    // Update store
    dispatch(setPrivateCall(null));
  };

const startPrivateCall: ThunkActionCreator = (isWith: PrivateCallParticipant, fanId?: UserId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const { broadcast } = getState();
    const isWithFan = !!fanId;
    const onStage = isUserOnStage(isWith);
    const fan = (): ActiveFan => R.path(['activeFans', 'map', fanId], broadcast);
    const stream = (): Stream => {
      if (!!fanId && !onStage) {
        const fanStreamId = fan().streamId;
        return opentok.getStreamById('backstage', fanStreamId);
      } // $FlowFixMe
      return opentok.getStreamByUserType('stage', isWith); // We know this is NOT 'activeFan'
    };

    try {
      const { domainId, fanUrl } = R.prop('event', broadcast);
      const baseRef = `activeBroadcasts/${domainId}/${fanUrl}`;

      // Update fan record
      if (isWithFan) { // $FlowFixMe
        const fanRef = firebase.database().ref(`${baseRef}/activeFans/${fanId}`); // We check again fanId above
        await fanRef.update({ inPrivateCall: true });

        // If calling an active fan, we need to make sure there is an active chat
        if (R.equals(isWith, 'activeFan')) {
          dispatch(chatWithActiveFan(R.assoc('inPrivateCall', true, fan())));
        }

        // If there is an active chat, we need to update the chat state
        // @TODO Link chat state to active fan state to avoid this(?)
        if (R.path(['chats', fanId], broadcast)) { // $FlowFixMe - We know fanId is defined here (isWithFan)
          dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: fanId, property: 'inPrivateCall', update: true });
        }
      }

      // Update broadcast record
      const broadcastUpdate = isWithFan ? { isWith, fanId } : { isWith };
      await activeBroadcastRef.update({ privateCall: broadcastUpdate });

      // We need to dispatch this action before trying to subscribe to get the correct stream container
      dispatch(setPrivateCall({ isWith, fanId }));

      // Publish audio to whichever session
      const instance = onStage ? 'stage' : 'backstage';
      await publishAudio(instance, true);
      opentok.unsubscribeAll('stage', true);
      const subscribeAction = R.equals(isWith, 'activeFan') ? 'subscribe' : 'subscribeToAudio';
      opentok[subscribeAction](instance, stream());
    } catch (error) {
      // @TODO Error handling
      console.log(error);
    }
  };

/**
 * Start or end private calls
 */
const connectPrivateCall: ThunkActionCreator = (isWith: PrivateCallParticipant, fanId?: UserId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const broadcast = getState().broadcast;
    const currentState = broadcast.privateCall;
    const currentlyInCall = !!currentState;
    // If there is not an active call or we want to start a call with someone other than the person in the active call
    const startCall = !currentlyInCall || !R.propEq('isWith', isWith, currentState);
    if (startCall) {
      if (currentlyInCall) {
        dispatch(await endPrivateCall());
      }
      // const onStageFan = R.equals('fan', isWith);
      dispatch(await startPrivateCall(isWith, fanId));
    } else {
      dispatch(await endPrivateCall());
    }
  };

const updateActiveFans: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    activeBroadcastRef.on('value', async (snapshot: firebase.database.DataSnapshot): AsyncVoid => {
      const { broadcast } = getState();
      const isInLine = (record: ActiveFan): boolean => R.has('name', record);
      const activeBroadcast = snapshot.val() || {};
      const viewers: ActiveFanMap = R.propOr({}, 'activeFans', activeBroadcast);
      const interactiveLimit: number = R.propOr(0, 'interactiveLimit', activeBroadcast);
      const archiving = R.prop('archiving', activeBroadcast);
      const fansInLine = R.filter(isInLine, viewers);
      const currentFans = R.path(['activeFans', 'map'], broadcast);
      const fansNoLongerActive: UserId[] = R.difference(R.keys(currentFans), R.keys(fansInLine));

      // Update backstage and on-stage fan records
      const backstageFanRecord = R.find(R.whereEq({ isBackstage: true }), R.values(viewers));
      const onStageFanRecord = R.find(R.whereEq({ isOnStage: true }), R.values(viewers));
      backstageFanRecord && dispatch({ type: 'UPDATE_ACTIVE_FAN_RECORD', fanType: 'backstageFan', record: backstageFanRecord });
      onStageFanRecord && dispatch({ type: 'UPDATE_ACTIVE_FAN_RECORD', fanType: 'fan', record: onStageFanRecord });

      R.forEach((fanId: ChatId): void => dispatch({ type: 'REMOVE_CHAT', chatId: fanId }), fansNoLongerActive);

      const privateCall = R.defaultTo({})(broadcast.privateCall);
      // Handle the case where a fan in a private call disconnects
      const fanInPrivateCall = R.prop('fanId', privateCall);
      const privateCallDisconnected = fanInPrivateCall && R.find(R.equals(fanInPrivateCall), fansNoLongerActive);
      if (privateCallDisconnected) {
        await dispatch(endPrivateCall());
      }

      // Handle the case where a host or celeb in a private call disconnects
      const { isWith } = R.defaultTo({})(activeBroadcast.privateCall);
      const { hostActive, celebrityActive } = activeBroadcast;
      if ((R.equals('host', isWith) && !hostActive) || (R.equals('celebrity', isWith) && !celebrityActive)) {
        await dispatch(endPrivateCall());
      }

      dispatch({ type: 'UPDATE_ACTIVE_FANS', update: viewers });
      dispatch({ type: 'UPDATE_VIEWERS', viewers: R.length(R.keys(viewers)) });
      dispatch({ type: 'SET_INTERACTIVE_LIMIT', interactiveLimit });
      dispatch({ type: 'SET_ARCHIVING', archiving });

      // We connect to each fan chat
      for (const fan in viewers) dispatch(connectToFanChats(viewers[fan]));
      // R.forEach((fan: ActiveFan): void => dispatch(connectToFanChats(fan)), viewers);
    });
  };

const connectBroadcast: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
    const credentials = R.pick(credentialProps, await getAdminCredentials(event.id));
    const producerHost = R.prop('producerHost', event);

    // Register the producer in firebase
    firebase.auth().onAuthStateChanged(async (user: AuthState): AsyncVoid => {
      if (!user) return;
      dispatch({ type: 'PRESENCE_CONNECTING', connecting: true });
      activeBroadcastRef = firebase.database().ref(`activeBroadcasts/${event.domainId}/${event.fanUrl}`);

      /* Let's check if the producer is already connected */
      const activeBroadcastSnapshot = await activeBroadcastRef.once('value');
      const { producerActive, producerHeartBeat } = activeBroadcastSnapshot.val();
      const heartbeatExpired = moment.duration(moment().diff(producerHeartBeat)).seconds() > heartBeatTime || false;

      if (producerActive && !heartbeatExpired) {
        /* Let the user know that he/she is already connected in another tab */
        dispatch(setBlockUserAlert());
      } else {
        try {
          await activeBroadcastRef.update({
            producerActive: true,
            privateCall: null,
            producerHeartBeat: moment.utc().valueOf(),
          });
          activeBroadcastRef.onDisconnect().update({
            producerActive: false,
            privateCall: null,
          });
          dispatch({ type: 'PRESENCE_CONNECTING', connecting: false });
        } catch (error) {
          console.log('Failed to create the record: ', error);
        }

        // Connect to the session
        await dispatch(connectToInteractive(credentials, producerHost));
        try {
          if (!producerHost) {
            await createEmptyPublisher('stage');
            await createEmptyPublisher('backstage');
          }
          dispatch(updateActiveFans());
          dispatch({ type: 'BROADCAST_CONNECTED', connected: true });
        } catch (error) {
          if (error.code === 1500) {
            /** Display the camera error alert only if we're in the producer panel */
            const { broadcast } = getState();
            if (broadcast.event) {
              dispatch(setCameraError());
            }
          }
        }
      }
    });
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const { domainId, fanUrl, status } = R.defaultTo({})(state.broadcast.event);
    const connecting = R.path(['broadcast', 'connecting'], state);
    const isClosed = status === 'closed';
    if (domainId && fanUrl) {
      const userScreen = await activeBroadcastRef.child('screen').once('value');
      const screen = userScreen.val() === 'producer' ? null : userScreen.val();

      activeBroadcastRef && activeBroadcastRef.onDisconnect().cancel();
      if (!isClosed && !connecting) {
        firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}`).update({
          producerActive: false,
          privateCall: null,
          screen,
        });
      }

      dispatch(stopHeartBeat());
      disconnect();
    }
    dispatch({ type: 'RESET_BROADCAST_EVENT' });
  };


const initializeBroadcast: ThunkActionCreator = (eventId: EventId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const event = R.path(['events', 'map', eventId], getState()) || await getEvent(eventId);
      const user = getState().currentUser;

      // Validate if the event requested belongs to the current admin
      if (!R.equals(user.domainId, event.domainId) && !user.superAdmin) {
        browserHistory.replace('/admin');
        return;
      }

      const actions = [
        updateStatus(eventId, 'preshow'),
        connectBroadcast(event),
        setBroadcastEvent(R.evolve(setStatus, event)),
      ];
      R.forEach(dispatch, notStarted(event) ? actions : R.tail(actions));
      isLive(event) && dispatch(startElapsedTime());
      dispatch(connectToUniversalChat());
    } catch (error) {
      browserHistory.replace('/admin');
      dispatch(setInfo({ title: 'Event Not Found', text: `Could not find event with the ID ${eventId}` }));
    }
  };

const reorderActiveFans: ActionCreator = (update: ActiveFanOrderUpdate): BroadcastAction => ({
  type: 'REORDER_BROADCAST_ACTIVE_FANS',
  update,
});

/**
 * Kick fan from stage or backstage feeds
 */
const kickFanFromFeed: ThunkActionCreator = (participantType: FanParticipantType): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const participant = R.path(['broadcast', 'participants', participantType], state);
    const to = R.path(['stream', 'connection'], participant);
    const stream = R.path(['stream'], participant);
    const isStage = R.equals('fan', participantType);
    const instance = isStage ? 'stage' : 'backstage';
    const type = isStage ? 'disconnect' : 'disconnectBackstage';
    const { domainId, fanUrl } = R.path(['event'], state.broadcast);
    const fan = participant.record;
    const inPrivateCall = R.equals(participantType, R.path(['broadcast', 'privateCall', 'isWith'], getState()));

    if (!isStage) {
      try {
        const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/activeFans/${fan.id}`);
        ref.update({ isBackstage: false });
      } catch (error) {
        console.log(error);
      }
    }
    await opentok.signal(instance, { type, to });
    stream && await opentok.unsubscribe(instance, stream);
    inPrivateCall && await dispatch(endPrivateCall());
    dispatch({ type: 'REMOVE_CHAT', chatId: participantType });
    dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType });
  };

const sendToBackstage: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    dispatch(startFanTransition());
    /* Remove the current backstagefan */
    const { broadcast } = getState();
    const participant = R.path(['participants', 'backstageFan'], broadcast);
    const event = R.prop('event', broadcast);
    const { domainId, fanUrl } = event;
    participant.stream && await dispatch(kickFanFromFeed('backstageFan'));

    /* End the private call */
    if (fan.inPrivateCall) {
      await dispatch(endPrivateCall());
    }

    /* Update the chat state to reflect the change in fan status */
    if (R.prop(fan.id, broadcast.chats)) {
      dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: fan.id, property: 'toType', update: 'backstageFan' });
    }

    /* Get the stream */
    const stream = opentok.getStreamById('backstage', fan.streamId);

    /* Add the participant to the backstage fan feed and start subscribing */
    await opentok.subscribe('backstage', stream, { subscribeToAudio: false });
    dispatch(updateParticipants('backstageFan', 'streamCreated', stream));
    dispatch(stopFanTransition());

    /* Let the fan know that he is on backstage */
    signal('backstage', { type: 'joinBackstage', to: stream.connection });

    /* Let the celeb & host know that there is a new fan on backstage */
    signal('stage', { type: 'newBackstageFan' });

    /* update the record in firebase */
    try {
      const ref = firebase.database().ref(`activeBroadcasts/${R.prop('domainId', event)}/${R.prop('fanUrl', event)}/activeFans/${fan.id}`);
      const activeFanRecord = await ref.once('value');
      if (activeFanRecord.val()) {
        ref.update({ isBackstage: true });
      }
    } catch (error) {
      // @TODO Error handling
      console.log(error);
    }

    /* update the volume for the backstageFan to 100 */
    restoreVolume(domainId, fanUrl, 'backstageFan');
  };

const sendToStage: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    /* Get the fan that is publishing in Backstage */
    const { broadcast } = getState();
    const currentFans = R.path(['activeFans', 'map'], broadcast);
    const isBackstage = R.propEq('isBackstage', true);
    const fan = R.findLast(isBackstage)(R.values(currentFans));
    if (fan) {
      dispatch(startFanTransition());
      analytics.log(logAction.producerMovesFanOnstage, logVariation.attempt);
      const stream = opentok.getStreamById('backstage', fan.streamId);
      const { event } = broadcast;
      const { domainId, fanUrl } = event;

      /* Remove the current user in stage */
      const currentFanOnStage = R.path(['participants', 'fan'], broadcast);
      currentFanOnStage.stream && signal('stage', { type: 'disconnect', to: currentFanOnStage.stream.connection });

      /* If fan is in private call, end the call before sending to stage. */
      if (fan.inPrivateCall) {
        dispatch(connectPrivateCall(fanTypeForActiveFan(fan), fan.id));
      }

      /* Update chat if exists */
      if (R.path(['chats', fan.id], broadcast)) {
        dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: fan.id, property: 'toType', update: 'fan' });
      }

      /* Send the first signal to the fan */
      signal('backstage', { type: 'joinHost', to: stream.connection });

      /* Stop subscribing the backstage fan */
      await opentok.unsubscribe('backstage', stream);
      dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType: 'backstageFan' });

      /* update the record in firebase */
      try {
        const ref = firebase.database().ref(`activeBroadcasts/${R.prop('domainId', event)}/${R.prop('fanUrl', event)}/activeFans/${fan.id}`);
        const activeFanRecord = await ref.once('value');
        analytics.log(logAction.producerMovesFanOnstage, logVariation.success);
        if (activeFanRecord.val()) {
          ref.update({ isOnStage: true, isBackstage: false });
        }
      } catch (error) {
        analytics.log(logAction.producerMovesFanOnstage, logVariation.fail);
        // @TODO Error handling
        console.log(error);
      }

      /* update the volume for the fan to 100 */
      restoreVolume(domainId, fanUrl, 'fan');

      /* Display the countdown and send the signal */
      let counter = 5;
      let timer;
      const sendSignal = (): Promise<> => signal('backstage', { type: 'joinHostNow', to: stream.connection });
      const updateCounter = () => {
        dispatch(updateStageCountdown(counter));
        if (counter >= 0) {
          counter -= 1;
        } else {
          clearInterval(timer);
          sendSignal();
          dispatch(stopFanTransition());
        }
      };
      timer = setInterval(updateCounter, 1000);
    }
  };


/**
 * Update the event status
 */
const changeStatus: ThunkActionCreator = (eventId: EventId, newStatus: EventStatus): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const goLive = newStatus === 'live';
    const type = goLive ? 'goLive' : 'finishEvent';
    const actionType = goLive ? logAction.producerGoLive : logAction.producerEndShow;
    const producerHost = R.path(['broadcast', 'event', 'producerHost'], getState());

    analytics.log(actionType, logVariation.attempt);
    try {
      /* If the event goes live, the producer should stop publishing to stage session */
      !producerHost && goLive && await opentok.unpublish('stage');
      /* If the event goes live, start the elapsed time counter */
      goLive && dispatch(setBroadcastEventShowStarted());
      /* If the event is finishing, let's stop the elapsed time counter */
      !goLive && dispatch(stopElapsedTime());
      /* Update the new status in firebase and update the state */
      const actions = [
        updateStatus(eventId, newStatus),
        setBroadcastEventStatus(newStatus),
      ];
      R.forEach(dispatch, actions);

      try {
        /* Send a signal to everyone connected to stage with the new status */
        await opentok.signal('stage', { type });
        analytics.log(actionType, logVariation.success);
      } catch (error) {
        analytics.log(actionType, logVariation.fail);
      }
    } catch (error) {
      analytics.log(actionType, logVariation.fail);
      console.log('error on change status ==>', error);
    }
  };

/**
 * Start the go live countdown
 */
const goLive: ThunkActionCreator = (eventId: EventId): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    await opentok.signal('stage', { type: 'prepareGoLive' });
    await dispatch(startCountdown());
    dispatch(changeStatus(eventId, 'live'));
  };

module.exports = {
  initializeBroadcast,
  resetBroadcastEvent,
  goLive,
  setBroadcastEventWithCredentials,
  connectPrivateCall,
  reorderActiveFans,
  sendToBackstage,
  chatWithActiveFan,
  chatWithParticipant,
  sendToStage,
  changeStatus,
  kickFanFromFeed,
};

