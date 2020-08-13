// @flow
import R from 'ramda';
import shortid from 'shortid';
import firebase from '../services/firebase';
import {
  uploadFileSuccess,
  uploadFileCancel,
  uploadFileStart,
} from './broadcast';
import { saveSharedFile, getUserSharedFiles } from '../services/api';

const shareFile: ThunkActionCreator = (file: File, chatId: ChatId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const fileId = shortid.generate();
    const ref = firebase.storage().ref().child(`sharedFiles/${fileId}`);
    const event = R.prop('event', state.broadcast);
    const { domainId, fanUrl } = event;
    const fromId = R.pathOr(null, ['currentUser', 'id'], getState());
    const fromName = R.path(['currentUser', 'displayName'], state) || 'Anonymous';

    try {
      dispatch(uploadFileStart('Sharing file...'));
      const snapshot: * = await ref.put(file);
      const url = await snapshot.ref.getDownloadURL();
      const refMessage = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/chats/${chatId}/messages`);
      const message = {
        id: fileId + Date.now().toString(),
        isFile: true,
        url,
        timestamp: Date.now(),
        name: file.name,
        type: file.type,
        fromId,
        fromName,
      };

      refMessage.push(message);
      dispatch({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', true, message) });
      dispatch(uploadFileSuccess('File shared successfuly'));

      return message;

    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error uploading file', error);
      dispatch(uploadFileCancel());
    }
  };

const broadcastFile: ThunkActionCreator = (file: File): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const event = R.prop('event', state.broadcast);
    const { domainId, fanUrl } = event;
    const fileId = shortid.generate();
    const ref = firebase.storage().ref().child(`sharedFiles/${fileId}`);
    const fromId = R.pathOr(null, ['currentUser', 'id'], getState());
    const fromName = R.path(['currentUser', 'displayName'], state) || 'Anonymous';

    try {
      dispatch(uploadFileStart('Sharing file...'));
      const snapshot: * = await ref.put(file);
      const url = await snapshot.ref.getDownloadURL();
      const refMessage = firebase.database().ref(`activeBroadcasts/${domainId}/${fanUrl}/universalChat/messages`);
      const message = {
        id: fileId + Date.now().toString(),
        isFile: true,
        url,
        timestamp: Date.now(),
        name: file.name,
        type: file.type,
        fromId,
        fromName,
      };
      refMessage.push(message);
      dispatch({ type: 'NEW_UNIVERSAL_CHAT_MESSAGE', message });
      dispatch(uploadFileSuccess('File shared successfuly'));

      return message;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error uploading file', error);
      dispatch(uploadFileCancel());
    }
  };

const createSharedFile: ThunkActionCreator = (chatFile: ChatFile): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const userId = R.pathOr(null, ['currentUser', 'id'], getState());
      const domainId = R.path(['settings', 'id'], getState());
      const file = await saveSharedFile({ ...chatFile, domainId, userId });

      dispatch({ type: 'RECV_SHARED_FILE', file });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Failed to save file to firebase record', error.message);
    }
  };

const getSharedFiles: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const userId = R.path(['currentUser', 'id'], getState());
      const domainId = R.path(['settings', 'id'], getState());
      const data = await getUserSharedFiles(domainId, userId);

      dispatch({ type: 'SET_SHARED_FILES', data });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error fetching shared files', error.message);
    }
  };

module.exports = {
  createSharedFile,
  getSharedFiles,
  shareFile,
  broadcastFile,
};
