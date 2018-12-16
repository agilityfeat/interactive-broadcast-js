// @flow
import Core from 'opentok-accelerator-core';
import R from 'ramda';
import platform from 'platform';

import screenSharing from '../config/screenSharing';

const instances: {[name: string]: Core} = {};
const listeners: {[name: string]: Core => void} = {};
const options: {[name: string]: OpentokSessionOptions} = {};

const state = (instance: SessionName): CoreState => instances[instance].state();

const getStreamByUserType = (instance: SessionName, userType: UserRole): Stream => {
  const core = instances[instance];
  const streamByUserType = (stream: Stream): boolean => {
    const connectionData = JSON.parse(R.pathOr(null, ['connection', 'data'], stream)) || {};
    return connectionData.userType === userType;
  };
  return R.find(streamByUserType, R.values(core.state().streams));
};

const getConnectionByUserType = (instance: SessionName, userType: UserRole): Connection => {
  const stream = getStreamByUserType(instance, userType);
  return stream && stream.connection;
};

const buildCoreOptions = (coreOptions: CoreInstanceOptions): CoreInstanceOptions => ({
  ...coreOptions,
  packages: ['screenSharing'],
  screenSharing,
});

/**
 * Get a stream by its id
 */
const getStreamById = (instance: SessionName, streamId: string): Stream => {
  const core = instances[instance];
  return core.state().streams[streamId];
};

/**
 * Get all the subscribers for an instance
 */
const getAllSubscribers = (instance: SessionName): Subscriber[] =>
  R.compose(
    R.flatten, // Flatten into a single array
    R.values, // Get just the map values (i.e. subscriber objects)
    R.map(R.values), // "Unnest" the subscribers
    R.pick(['screen', 'camera', 'sip']), // Take only the camera and sip subscribers
  )(R.prop(instance, instances).state().subscribers); // Get a map of all subscribers by type

/**
 * Create instances of core
 */
const init = (instancesToCreate: CoreInstanceOptions[]) => {
  const createCoreInstance = ({ name, coreOptions, eventListeners, opentokOptions = {} }: CoreInstanceOptions) => {
    instances[name] = new Core(buildCoreOptions(coreOptions));
    listeners[name] = eventListeners;
    options[name] = opentokOptions;
  };
  try {
    R.forEach(createCoreInstance, instancesToCreate);
  } catch (error) {
    throw error;
  }
};

/**
 * Connect to all sessions/instances of core
 */
const connect = async (instancesToConnect: InstancesToConnect): AsyncVoid => {

  const connectInstance = async (name: SessionName): AsyncVoid => {
    const instance = instances[name];
    const instanceOptions = options[name];
    listeners[name](instance); // Connect listeners
    const connection = await instance.connect();
    return instanceOptions.autoPublish ? instance.startCall() : connection;
  };

  try {
    const connections = await Promise.all(R.map(connectInstance, R.values(instancesToConnect)));
    return connections;
  } catch (error) {
    throw error;
  }
};

const createEmptyPublisher = async (instance: SessionName): AsyncVoid => {
  const core = instances[instance];
  try {
    await core.startCall({ publishVideo: false, publishAudio: false, videoSource: null });
    return;
  } catch (error) {
    throw error;
  }
};


/**
 * get the first publisher in state
 */
const getPublisher = (instance: SessionName, type: 'camera' | 'screen'): Publisher =>
  R.head(R.values(state(instance).publishers[type]));

const publishAudio = async (instance: SessionName, shouldPublish: boolean): AsyncVoid => {
  const publisher = getPublisher(instance, 'screen') || getPublisher(instance, 'camera');
  if (shouldPublish) {
    if (publisher) {
      publisher.publishAudio(true);
      return;
    } else {
      // Since the producer is creating an empty publisher when joining, we should never get here =)
      try {
        await instances[instance].startCall({ publishVideo: false });
        return;
      } catch (error) {
        throw error;
      }
    }
  }
  if (!publisher) {
    console.log(`${instance} publisher does not exist`);
  } else {
    publisher.publishAudio(false);
  }
};
/**
 * Disconnect from all sessions/instances of core
 */
const disconnect = () => {

  const disconnectInstance = (instance: Core) => {
    instance.off();
    instance.disconnect();
  };

  try {
    R.forEach(disconnectInstance, R.values(instances));
  } catch (error) {
    console.log('disconnect error', error);
  }
};

/**
 * Disconnect from a particular session/instance of core
 */
const disconnectFromInstance = (instanceToDisconnect: SessionName) => {
  try {
    instances[instanceToDisconnect].off();
    instances[instanceToDisconnect].disconnect();
  } catch (error) {
    console.log('disconnect error', error);
  }
};

const changeVolume = (instance: SessionName, userType: UserRole, volume: number) => {
  const core = instances[instance];
  const stream = getStreamByUserType(instance, userType);
  if (stream) {
    const subscribers = core.getSubscribersForStream(stream);
    subscribers.forEach((subscriber: Subscriber): Subscriber => subscriber.setAudioVolume(volume));
  }
};


const endScreenShare = async (instance: SessionName): AsyncVoid => {
  const core = instances[instance];
  core.screenSharing.end();
};

/**
 * Send a signal specifying the core instance 'backstage' or 'stage'
 */
const signal = async (instance: SessionName, { type, data, to }: SignalParams): AsyncVoid => {
  try {
    const core: Core = instances[instance];
    core.signal(type, data, to);
  } catch (error) {
    console.log('signaling error', error);
  }
};


const startScreenShare = async (instance: SessionName): Promise<*> => {
  const core = instances[instance];
  return core.screenSharing.extensionAvailable()
    .then((): void => core.screenSharing.start());
};


/**
 * Get a connection object using a stream id or user type
 */
const getConnection = (instance: SessionName, streamId: string, userType?: UserRole): Connection => {
  const core = instances[instance];
  let connection = R.path(['streams', streamId, 'connection'], core.state());
  // Has the stream been destroyed? If so, try to get the connection from the session object
  if (!connection) {
    const session = core.getSession();
    connection = session.connections.find((c: Connection): boolean => {
      try {
        return JSON.parse(c.data).userType === userType;
      } catch (error) {
        return false;
      }
    });
  }
  return connection;
};

/**
 * Subscribe to all streams in the session instance
 */
const subscribeAll = async (instance: SessionName, audioOnly?: boolean = false, ignoreProducer?: boolean = false): Promise<CoreState> => {
  const core = instances[instance];
  if (audioOnly) {
    R.forEach((s: Subscriber): Subscriber => s.subscribeToAudio(true), getAllSubscribers(instance));
  } else {
    const streams = core.state().streams;
    const isProducer = (s: Stream): boolean => ignoreProducer ? JSON.parse(s.connection.data).userType === 'producer' : true;
    const subscriptionPromises = R.filter(isProducer, Object.values(streams)).map(core.subscribe);
    await Promise.all(subscriptionPromises);
  }
  return core.state();
};

const createEmptySubscriber = async (instance: SessionName, stream: Stream): AsyncVoid => {
  const core = instances[instance];
  try {
    /** 
     * Putting subscribeToAudio in true by default and then turn it to false is just a temporary workaround  
     * to solve an issue in OT 2.14
    */
    const subscriber = await core.subscribe(stream, { subscribeToAudio: true, subscribeToVideo: false });
    subscriber.subscribeToAudio(false);
    return;
  } catch (error) {
    throw error;
  }
};

const toggleLocalVideo = (instance: SessionName, enable: boolean): void => instances[instance].toggleLocalVideo(enable);

const toggleLocalAudio = (instance: SessionName, enable: boolean): void => instances[instance].toggleLocalAudio(enable);

/**
 * Unsubscribe from all streams in the instance session
 */
const unsubscribeAll = (instance: SessionName, audioOnly?: boolean = false, ignoreProducer?: boolean = false): CoreState => { // eslint-disable-line
  const core = instances[instance];
  const isProducer = (s: Subscriber): boolean => ignoreProducer ? JSON.parse(s.session.connection.data).userType === 'producer' : true;
  const subscribers: Subscriber[] = R.filter(isProducer, getAllSubscribers(instance));
  const action = (s: Subscriber): Subscriber => audioOnly ? s.subscribeToAudio(false) : core.unsubscribe(s);
  R.forEach(action, subscribers);
  return core.state();
};

/**
 * subscribe to a stream
 */
const subscribe = async (instance: SessionName, stream: Stream, subscriberProperties?: SubscriberProperties): AsyncVoid => {
  try {
    const core = instances[instance];
    await core.subscribe(stream, subscriberProperties);
  } catch (error) {
    console.log('subscribe error', error);
  }
};

const toggleSubscribeAudio = (instance: SessionName, stream: Stream, shouldSubscribe: boolean) => {
  const core = instances[instance];
  const { streamMap, subscribers } = core.state();
  const subscriber = R.prop(R.prop(stream.streamId, streamMap), R.merge(subscribers.camera, subscribers.sip));
  subscriber && subscriber.subscribeToAudio(shouldSubscribe);
};

const subscribeToAudio: ((SessionName, Stream) => void) = R.partialRight(toggleSubscribeAudio, [true]);

const unsubscribe = (instance: SessionName, stream: Stream) => {
  const core = instances[instance];
  const { streamMap, subscribers } = core.state();
  const subscriber = subscribers.camera[streamMap[stream.streamId]] || subscribers.sip[streamMap[stream.streamId]];
  subscriber && core.unsubscribe(subscriber);
};

const unsubscribeFromAudio: ((SessionName, Stream) => void) = R.partialRight(toggleSubscribeAudio, [false]);

const startCall = async (instance: SessionName): Promise<CoreStateWithPublisher> =>
  instances[instance].startCall({ publishVideo: true, publishAudio: true });

const endCall = async (instance: SessionName): AsyncVoid => instances[instance].endCall();

const unpublish = async (instance: SessionName): AsyncVoid => {
  try {
    const core = instances[instance];
    const publishers = core.state().publishers;
    const destroyPublisher = async (publisher: Publisher): AsyncVoid => core.communication.session.unpublish(publisher);
    Object.values(publishers.camera).forEach(destroyPublisher);
    core.communication.state.removeAllPublishers();
  } catch (error) {
    console.log('unpublish error', error);
  }
};

const createTestSubscriber = async (instance: SessionName): Promise<TestSubscriber> => {
  const core = instances[instance];
  const isIE = platform.name === 'IE';
  const session = core.getSession();

  const createContainerElements = (): { publisherContainer: string, subscriberContainer: string } => {
    const container = document.createElement('div');
    const publisherEl = document.createElement('div');
    publisherEl.id = 'testPublisher';
    const subscriberEl = document.createElement('div');
    subscriberEl.id = 'testSubscriber';
    container.style.display = 'none';
    container.appendChild(publisherEl);
    container.appendChild(subscriberEl);
    document.body && document.body.appendChild(container);
    return { publisherContainer: publisherEl.id, subscriberContainer: subscriberEl.id };
  };

  const createPublisherStream = (publisherContainer: string): Promise<TestStream> =>
    new Promise((resolve: Promise.resolve<TestStream>, reject: Promise.reject<Error>) => {
      const publisher = session.publish(publisherContainer, (err: Error) => { // $FlowFixMe
        err ? reject(err) : resolve(publisher.stream);
      });
    });

  const createSubscriber = (stream: TestStream, subscriberContainer: string): Promise<TestSubscriber> =>
    new Promise((resolve: Promise.resolve<TestSubscriber>, reject: Promise.reject<Error>) => {
      const props = { audioVolume: 0, testNetwork: true };
      const subscriber: TestSubscriber = session.subscribe(stream, subscriberContainer, props, (err: Error) => { // $FlowFixMe
        err ? reject(err) : resolve(subscriber);
      });
    });

  // This publisher uses the default resolution (640x480 pixels) and frame rate (30fps).
  // For other resoultions you may need to adjust the bandwidth conditions in
  // testStreamingCapability().
  try {
    if (!isIE) {
      const { publisherContainer, subscriberContainer } = createContainerElements();
      const testStream = await createPublisherStream(publisherContainer);
      const subscriber = await createSubscriber(testStream, subscriberContainer);
      return subscriber;
    }
  } catch (error) {
    console.log(error);
    return Promise.reject(new Error('Failed to create test subscriber'));
  }
};

/**
 * Force disconnect a participant
 */
const forceDisconnect = (instance: SessionName, connection: Connection): void => { // eslint-disable-line
  const core = instances[instance];
  return core.forceDisconnect(connection);
};


module.exports = {
  init,
  connect,
  disconnect,
  disconnectFromInstance,
  changeVolume,
  getConnectionByUserType,
  getStreamByUserType,
  getStreamById,
  createEmptyPublisher,
  createTestSubscriber,
  createEmptySubscriber,
  publishAudio,
  signal,
  getConnection,
  subscribeAll,
  toggleLocalAudio,
  toggleLocalVideo,
  startScreenShare,
  endScreenShare,
  unsubscribeAll,
  state,
  subscribe,
  subscribeToAudio,
  unsubscribe,
  unsubscribeFromAudio,
  getPublisher,
  startCall,
  endCall,
  unpublish,
  forceDisconnect,
};
