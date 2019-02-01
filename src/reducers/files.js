// @flow
import R from 'ramda';

const initialState: FilesState = {
  sharedByMe: null,
  sharedWithMe: null,
  sharedWithAll: null,
};

const files = (state: FilesState = initialState, action: FileAction): FilesState => {
  switch (action.type) {
    case 'SEND_SHARED_FILE':
      return R.assocPath(['sharedByMe', action.file.id], action.file, state);
    case 'RECV_SHARED_FILE':
      return R.assocPath(['sharedWithMe', action.file.id], action.file, state);
    case 'SET_SHARED_FILES':
      return action.data;
    default:
      return state;
  }
};

export default files;
