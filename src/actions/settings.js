// @flow
import R from 'ramda';
import firebase from '../services/firebase';

const listenSiteSettings: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    try {
      firebase.auth().onAuthStateChanged(async (user): AsyncVoid => {
        if (user) {
          const ref = firebase.database()
                .ref('admins')
                .orderByChild('domain')
                .equalTo(window.location.hostname);

          ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
            const admin = snapshot.val();
            if (admin) {
              const settings = R.pick(
                ['siteColor', 'registrationEnabled', 'siteLogo', 'siteFavicon'],
                admin[Object.keys(admin)[0]],
              );
              dispatch({ type: 'SET_SITE_SETTINGS', settings });
            } else {
              dispatch({ type: 'SITE_SETTINGS_ERR' });
            }
          });
        } else {
          await firebase.auth().signInAnonymously();
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

module.exports = {
  listenSiteSettings,
};
