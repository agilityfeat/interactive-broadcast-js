// @flow
import R from 'ramda';
import firebase from '../services/firebase';
import {
  getAuthToken,
  getAuthTokenUser,
  getAuthTokenViewer,
  sendViewerResetEmail,
  resetViewerPassword,
} from '../services/api';
import { saveAuthToken, saveState } from '../services/localStorage';
import { logIn, setCurrentUser, logOut } from './currentUser';
import { setSuccess, resetAlert, setInfo } from './alert';

const authError: ActionCreator = (error: null | Error): AuthAction => ({
  type: 'AUTH_ERROR',
  error,
});

const userForgotPassword: ThunkActionCreator = (forgot: boolean): Thunk =>
  (dispatch: Dispatch) => {
    dispatch(authError(null));
    dispatch({ type: 'AUTH_FORGOT_PASSWORD', forgot });
  };

const validate: ThunkActionCreator = (uid: string, idToken: string): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const { token } = await getAuthToken(idToken);
      saveAuthToken(token);
      dispatch(logIn(uid));
    } catch (error) {
      await dispatch(authError(error));
    }
  };

const validateUser: ThunkActionCreator = (userType: UserRole, userUrl: string, idToken?: string): Thunk =>
  async (dispatch: Dispatch, getState: () => State): AsyncVoid => {
    try {
      const { settings } = getState();
      const { token } = await getAuthTokenUser(settings.id, userType, userUrl, idToken);
      dispatch({ type: 'SET_AUTH_TOKEN', token });
      saveAuthToken(token);
    } catch (error) {
      await dispatch(authError(error));
    }
  };

const signInViewer: ThunkActionCreator = ({ email, password, userUrl }: ViewerAuthCredentials): Thunk =>
  async (dispatch: Dispatch, getState: () => State): AsyncVoid => {
    try {
      const { settings } = getState();
      const { token, user } = await getAuthTokenViewer(settings.id, email, password, userUrl);

      dispatch({ type: 'SET_AUTH_TOKEN', token });
      saveAuthToken(token);
      await dispatch(setCurrentUser({ ...user, uid: user.id, isViewer: true }));
    } catch (error) {
      await dispatch(authError(error));
    }
  };


const signIn: ThunkActionCreator = ({ email, password }: AuthCredentials): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const { user } = await firebase.auth().signInWithEmailAndPassword(email, password);
      const idToken = await user.getIdToken(true);
      await dispatch(validate(R.prop('uid', user), idToken));
    } catch (error) {
      await dispatch(authError(error));
    }
  };

const signOut: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    // We need to ensure the localstorage is updated ASAP
    const { currentUser } = getState();

    dispatch(logOut());
    saveState({ currentUser: null });

    firebase.auth().signOut().then(() => {
      if (!currentUser.isViewer) window.location.href = '/admin';
    });
  };


const viewerResetPassword: ThunkActionCreator = ({ token, password }: ResetCredentials): Thunk =>
  async (dispatch: Dispatch): Promise<*> => {
    try {
      const data = await resetViewerPassword(token, password);
      const options: AlertPartialOptions = {
        title: 'Password Reset',
        text: 'Your password has been successfully reset',
        onConfirm: (): void => R.forEach(dispatch, [resetAlert()]),
      };
      dispatch(setSuccess(options));

      return data;
    } catch (error) {
      dispatch(setInfo({ title: 'Password Reset', text: 'There was a problem resetting your password' }));
    }
  };

const resetPassword: ThunkActionCreator = ({ userUrl, domainId, email }: AuthCredentials, isViewer: boolean=false): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      if (isViewer) await sendViewerResetEmail(userUrl, domainId, email);
      else await firebase.auth().sendPasswordResetEmail(email);

      const options: AlertPartialOptions = {
        title: 'Password Reset',
        text: 'Please check your inbox for password reset instructions',
        onConfirm: (): void => R.forEach(dispatch, [resetAlert(), userForgotPassword(false)]),
      };
      dispatch(setSuccess(options));
    } catch (error) {
      dispatch(setInfo({ title: 'Password Reset', text: 'We couldn\'t find an account for that email address.' }));
    }
  };

module.exports = {
  validateUser,
  signIn,
  signInViewer,
  signOut,
  userForgotPassword,
  resetPassword,
  viewerResetPassword,
};
