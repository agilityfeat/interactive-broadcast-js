// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import screenSharing from '../config/screenSharing';

const setAlert: ActionCreator = (options: AlertState): AlertAction => ({
  type: 'SET_ALERT',
  options,
});

const resetAlert: ActionCreator = (): AlertAction => ({
  type: 'RESET_ALERT',
});

const setWarning: ThunkActionCreator = (options: AlertPartialOptions): Thunk =>
  (dispatch: Dispatch) => {
    const defaultOptions = {
      show: true,
      type: 'warning',
      title: 'Warning',
      text: '',
      onConfirm: (): void => dispatch(resetAlert()),
      showCancelButton: true,
    };
    dispatch(setAlert(R.merge(defaultOptions, options)));
  };

const setSuccess: ThunkActionCreator = (options: AlertPartialOptions): Thunk =>
  (dispatch: Dispatch) => {
    const defaultOptions = {
      show: true,
      type: 'success',
      title: 'Success',
      text: null,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(R.merge(defaultOptions, options)));
  };

const setError: ThunkActionCreator = (text: string): Thunk =>
  (dispatch: Dispatch) => {
    const options = {
      show: true,
      type: 'error',
      title: 'Error',
      text,
      html: true,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(options));
  };

const setExtensionError: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const options = {
      show: true,
      type: 'error',
      title: 'No Screensharing Extension',
      text: 'Please install the screensharing extension',
      html: true,
      showCancelButton: true,
      onConfirm: (): void => {
        window.open(screenSharing.extensionURL, '_blank');
        dispatch(resetAlert());
      },
    };
    dispatch(setAlert(options));
  };

const setInfo: ThunkActionCreator = (options: AlertPartialOptions): Thunk =>
  (dispatch: Dispatch) => {
    const defaultOptions = {
      show: true,
      type: 'info',
      title: null,
      text: null,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(R.merge(defaultOptions, options)));
  };

const setBlockUserAlert: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const options = {
      show: true,
      title: '',
      text: 'It seems you have the event opened in another tab. Please make sure you have only one tab opened at a time.',
      showConfirmButton: true,
      html: true,
      allowEscapeKey: false,
      onConfirm: () => {
        browserHistory.push('/admin');
        dispatch(resetAlert());
      },
    };
    dispatch(setAlert(options));
  };


const setCameraError: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const text = 'Please allow access to your camera and microphone to continue.' +
                    '<br/>Click the camera icon in your browser bar to view the permissions dialog.';
    const options = {
      show: true,
      title: 'Aw, what happened?',
      type: 'error',
      text,
      showConfirmButton: true,
      html: true,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(options));
  };

module.exports = {
  setAlert,
  setError,
  setInfo,
  setSuccess,
  setWarning,
  resetAlert,
  setBlockUserAlert,
  setExtensionError,
  setCameraError,
};
