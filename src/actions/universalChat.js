
// @flow
import R from 'ramda';
import firebase from '../services/firebase';
import { fanTypeForActiveFan } from '../services/util';
import { displayUniversalChat } from './broadcast';
import { createSharedFile } from './files';

// Connect to the universal chat
const connectToUniversalChat: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const event = R.prop('event', getState().broadcast);
      const { domainId, fanUrl } = event;
      const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/universalChat/messages`);
      let messagesLength;
      let messagesAdded;
      // We load the messages once
      ref.once('value', (snapshot: firebase.database.DataSnapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot: firebase.database.DataSnapshot) => {
          const message = childSnapshot.val();
          if (message.isFile) {
            createSharedFile(message); // REVISAR ESTO
          }
          messages.push(childSnapshot.val());
        });
        if (messages) {
          dispatch({ type: 'UPDATE_UNIVERSAL_CHAT_MESSAGES', messages });
          messagesLength = messages.length;
          messagesAdded = 0;

          // Since child_added triggers for initial messages too,
          // we add an interator to just add when a new messages enters.
          ref.on('child_added', (childSnapshot: firebase.database.DataSnapshot) => {
            if (messagesAdded < messagesLength) {
              messagesAdded += 1;
            } else {
              const message = childSnapshot.val();
              if (message) {
                dispatch(displayUniversalChat(true));
                dispatch({ type: 'NEW_UNIVERSAL_CHAT_MESSAGE', message });
              }
              if (message.isFile) {
                createSharedFile(message); // REVISAR ESTO
              }
            }
          });
        }
      });
    } catch (error) {
      console.log('error', error);
    }
  };
// -----------------------------------------------------------------------------
// Connect to a private chat
const connectToPrivateChat: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const state = getState();
      const event = R.prop('event', state.broadcast);
      const { domainId, fanUrl } = event;
      const chatId = R.path(['currentUser', 'id'], state);
      const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/chats/${chatId}/messages`);
      let messagesLength;
      let messagesAdded;

      // We load the messages once
      ref.once('value', (snapshot: firebase.database.DataSnapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot: firebase.database.DataSnapshot) => {
          const message = childSnapshot.val();
          if (message.isFile) createSharedFile(message); // REVISAR ESTO
          messages.push(childSnapshot.val());
        });
        if (messages) {
          const data = { messages, chatId, displayed: false, minimized: false };
          dispatch({ type: 'UPDATE_PRIVATE_CHAT', chatId, data });
          messagesLength = messages.length;
          messagesAdded = 0;

          // Since child_added triggers for initial messages too,
          // we add an interator to just add when a new messages enters.
          ref.on('child_added', (childSnapshot: firebase.database.DataSnapshot) => {
            if (messagesAdded < messagesLength) {
              messagesAdded += 1;
            } else {
              const message = childSnapshot.val();
              if (message) {
                dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId, property: 'displayed', update: true });
                dispatch({ type: 'NEW_CHAT_MESSAGE', message, chatId });
              }
              if (message.isFile) createSharedFile(message); // REVISAR ESTO
            }
          });
        }
      });
    } catch (error) {
      console.log('error', error);
    }
  };
// -----------------------------------------------------------------------------
// Send universal chat message
const universalChatMessage: ThunkActionCreator = (message: ChatPartial): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoud => {
    const state = getState();
    const event = R.prop('event', state.broadcast);
    const { domainId, fanUrl } = event;
    const fromName = R.path(['currentUser', 'displayName'], state) || 'Anonymous';
    const messageContent = {
      text: message.text,
      fromId: message.fromId || 'Anonymous',
      fromName,
      timestamp: message.timestamp,
    };
    try {
      const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/universalChat/messages`);
      ref.push(messageContent);
    } catch (error) {
      // @TODO Error handling
      console.log('Failed to send chat message', error);
    }
    dispatch({ type: 'NEW_UNIVERSAL_CHAT_MESSAGE', message: messageContent });
  };
// -----------------------------------------------------------------------------
const connectToFanChats: ThunkActionCreator = (fan?: ActiveFan): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const state = getState();
      const event = R.prop('event', state.broadcast);
      const { domainId, fanUrl } = event;
      const chatId = fan ? fan.fanId : '5mZxfO6HX';
      // @CARLOS TODO: cambiar esta logica para conectarse a todos los chats
      const ref = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/chats/${chatId}/messages`);
      let messagesLength;
      let messagesAdded;

      // We load the messages once
      ref.once('value', (snapshot: firebase.database.DataSnapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot: firebase.database.DataSnapshot) => {
          const message = childSnapshot.val();
          if (message.isFile) createSharedFile(message); // REVISAR ESTO
          messages.push(childSnapshot.val());
        });
        const existingChat = R.path(['broadcast', 'chats', chatId], state);
        if (messages) {
          if (!existingChat) {
            dispatch({ type: 'START_NEW_FAN_CHAT', fromId: chatId, fan, toType: fanTypeForActiveFan(fan), display: false });
            dispatch({ type: 'UPDATE_PRIVATE_CHAT_MESSAGES', chatId, messages });
          }

          messagesLength = messages.length;
          messagesAdded = 0;

          // Since child_added triggers for initial messages too,
          // we add an interator to just add when a new messages enters.
          ref.on('child_added', (childSnapshot: firebase.database.DataSnapshot) => {
            if (messagesAdded < messagesLength) {
              messagesAdded += 1;
            } else {
              const message = childSnapshot.val();
              if (message) {
                dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId, property: 'displayed', update: true });
                dispatch({ type: 'NEW_CHAT_MESSAGE', message, chatId });
              }
              if (message.isFile) createSharedFile(message); // REVISAR ESTO
            }
          });
        }
      });
    } catch (error) {
      console.log('error', error);
    }
  };
// -----------------------------------------------------------------------------
module.exports = {
  connectToUniversalChat,
  connectToPrivateChat,
  connectToFanChats,
  universalChatMessage,
};
