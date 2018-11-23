// @flow
import { browserHistory } from 'react-router';
import { getUser, getViewer } from '../services/api';

const setCurrentUser: ActionCreator = (user: User): UserAction => ({
  type: 'SET_CURRENT_USER',
  user,
});

const logInViewer: ThunkActionCreator = (userId: string): Thunk =>
  (dispatch: Dispatch, getState: () => State) => {
    getViewer(getState().settings.id, userId, getState().auth.authToken)
    .then((user: User) => {
      dispatch(setCurrentUser({...user, uid: userId}));
      // browserHistory.push('/admin');
    })
    .catch((error: Error): void => console.log(error)); // TODO Use alert to have user refresh
  };

const logIn: ThunkActionCreator = (userId: string): Thunk =>
  (dispatch: Dispatch) => {
    getUser(userId)
    .then((user: User) => {
      dispatch(setCurrentUser(user));
      browserHistory.push('/admin');
    })
    .catch((error: Error): void => console.log(error)); // TODO Use alert to have user refresh
  };

const logOut: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    dispatch(setCurrentUser(null));
  };

module.exports = {
  logInViewer,
  logIn,
  logOut,
  setCurrentUser,
};
