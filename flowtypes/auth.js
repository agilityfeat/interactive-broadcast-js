// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type AuthToken = string;

declare type AuthState = {
  error: boolean,
  forgotPassword: boolean,
  authToken: null | AuthToken
 };

declare type AuthCredentials = { email: string, password?: string };
declare type ViewerAuthCredentials = { email: string, password?: string, adminId: string };
declare type AuthAction =
  { type: 'AUTHENTICATE_USER', credentials: AuthCredentials } |
  { type: 'AUTH_ERROR', error: null | Error } |
  { type: 'AUTH_FORGOT_PASSWORD', forgot: boolean } |
  { type: 'SET_AUTH_TOKEN', token: string };
