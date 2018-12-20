// @flow
import R from 'ramda';

const properCase = (input: string): string => `${R.toUpper(R.head(input))}${R.tail(input)}`;

// Get the fan type based on their status
const fanTypeByStatus = (status: FanStatus): FanType => {
  switch (status) {
    case 'inLine':
      return 'activeFan';
    case 'backstage':
      return 'backstageFan';
    case 'stage':
      return 'fan';
    default:
      return 'activeFan';
  }
};

// Get the fan type based on their active fan record
const fanTypeForActiveFan = (fan: ActiveFan): FanType => {
  if (fan.isBackstage) {
    return 'backstageFan';
  } else if (fan.isOnStage) {
    return 'fan';
  }
  return 'activeFan';
};


const isFan = (type: UserRole | 'activeFan'): boolean => R.contains(type, ['fan', 'backstageFan', 'activeFan']);

const isUserOnStage = (user: ParticipantType | 'activeFan'): boolean => R.contains(user, ['fan', 'host', 'celebrity']);

const translateRole = (type: ParticipantType): string => {
  const translation = {
    fan: 'viewer',
    host: 'host',
    celebrity: 'guest',
    backstageFan: 'backstage viewer',
  };

  return translation[type];
};


const alterAllButScreen = (userType: UserType, action: 'hide' | 'show'): boolean => {
  if (action === 'hide') {
    const participants = ['fan', 'celebrity', 'host'];
    const styleEl = document.createElement('style');
    styleEl.id = 'hide-cameras';

    participants.forEach((k: ParticipantType) => {
      if (k !== userType) styleEl.innerHTML += `#video${k} { display: none; }`;
    });

    document.body.appendChild(styleEl);
  } else {
    const styleEl = document.getElementById('hide-cameras');
    styleEl && styleEl.parentNode.removeChild(styleEl);
  }
};

/**
 * shows or hides participant video feed
 */
const alterCameraElement = (userType: UserType, action: 'hide' | 'show') => {
  const elements = document.querySelectorAll(`.camera.${userType}`);
  for (let i = 0; i < elements.length; i += 1) {
    elements[i].style.display = action === 'hide' ? 'none' : 'block';
  }
};


const tagSubscriberElements = (state: CoreStateWithPublisher, event: SubscribeEventType) => {
  switch (event) {
    case 'subscribeToCamera': {
      const stream = R.path(['subscriber', 'stream'], state);
      const connectionData: { userType: UserRole } = JSON.parse(R.path(['connection', 'data'], stream));
      state.subscriber.element.classList.add('camera');
      state.subscriber.element.classList.add(connectionData.userType);
      break;
    }
    case 'subscribeToScreen': {
      const stream = R.path(['subscriber', 'stream'], state);
      const connectionData: { userType: UserRole } = JSON.parse(R.path(['connection', 'data'], stream));
      state.subscriber.element.classList.add('screen');
      state.subscriber.element.classList.add(connectionData.userType);
      break;
    }
    default:
      break;
  }
};

module.exports = {
  fanTypeForActiveFan,
  fanTypeByStatus,
  isFan,
  isUserOnStage,
  properCase,
  translateRole,
  alterCameraElement,
  tagSubscriberElements,
  alterAllButScreen,
};
