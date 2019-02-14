// @flow
import R from 'ramda';
import shortid from 'shortid';
import firebase from '../services/firebase';
import {
  sendChatMessage,
  startAllChats,
  uploadFileSuccess,
  uploadFileCancel,
  uploadFileStart,
} from './broadcast';
import { saveSharedFile, getUserSharedFiles } from '../services/api';

const shareFile: ThunkActionCreator = (file: File, chatId: ChatId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const fileId = shortid.generate();
    const ref = firebase.storage().ref().child(`sharedFiles/${fileId}`);
    const chat: ChatState = R.path(['broadcast', 'chats', chatId], getState());

    try {
      dispatch(uploadFileStart('Sharing file...'));
      const snapshot: * = await ref.put(file);
      const fileData = {
        id: fileId + Date.now().toString(),
        isFile: true,
        url: await snapshot.ref.getDownloadURL(),
        name: file.name,
        type: file.type,
        timestamp: Date.now(),
        fromType: chat.fromType,
        fromId: chat.fromId,
      };

      dispatch(sendChatMessage(chatId, fileData));
      dispatch(uploadFileSuccess('File shared successfuly'));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error uploading file', error);
      dispatch(uploadFileCancel());
    }
  };

const broadcastFile: ThunkActionCreator = (file: File): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const fileId = shortid.generate();
    const ref = firebase.storage().ref().child(`sharedFiles/${fileId}`);

    try {
      dispatch(startAllChats());
      dispatch(uploadFileStart('Sharing file...'));
      const snapshot: * = await ref.put(file);
      const url = await snapshot.ref.getDownloadURL();
      dispatch(uploadFileSuccess('File shared successfuly'));
      const fileData = {
        id: fileId + Date.now().toString(),
        isFile: true,
        url,
        timestamp: Date.now(),
        name: file.name,
        type: file.type,
      };

      R.forEachObjIndexed(
        (v: ChatState, chatId: ChatId) => {
          const { fromType, fromId } = R.path(['broadcast', 'chats', chatId], getState());
          dispatch(sendChatMessage(chatId, R.merge(fileData, { fromType, fromId })));
        },
        R.path(['broadcast', 'chats'], getState()),
      );

      return fileData;

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
