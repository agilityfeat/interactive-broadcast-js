// @flow
import R from 'ramda';
import firebase from '../services/firebase';

const listenSiteSettings: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    try {
      firebase.auth().onAuthStateChanged(async (user: User): AsyncVoid => {
        if (user) {
          const ref = firebase.database()
                .ref('domains')
                .orderByChild('domain')
                .equalTo(window.location.host);

          ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
            const domain = snapshot.val();
            if (domain) {
              const settings = R.pick(
                ['id', 'siteColor', 'registrationEnabled', 'siteLogo', 'siteFavicon'],
                domain[Object.keys(domain)[0]],
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
