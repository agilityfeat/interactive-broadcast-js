// @flow
import { combineReducers } from 'redux';
import { reducer as toastr } from 'react-redux-toastr';

/** Reducers */
import alert from './alert';
import auth from './auth';
import broadcast from './broadcast';
import currentUser from './currentUser';
import domains from './domains';
import events from './events';
import fan from './fan';
import settings from './settings';
import users from './users';

/** Combine Reducers */
const interactiveBroadcastApp = combineReducers({
  alert,
  auth,
  broadcast,
  currentUser,
  domains,
  events,
  fan,
  settings,
  toastr,
  users,
});

export default interactiveBroadcastApp;
