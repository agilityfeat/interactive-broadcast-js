// @flow
import firebase from '../services/firebase';

const listenSiteSettings: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    try {
      const ref = firebase.database()
            .ref('admins')
            .orderByChild('domain')
            .equalTo(window.location.hostname);

      ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
        const admin = snapshot.val();
        const { siteColor, registerEnabled } = admin[Object.keys(admin)[0]];
        const settings = { siteColor, registerEnabled };

        dispatch({ type: 'SET_SITE_SETTINGS', settings });
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

module.exports = {
  listenSiteSettings,
};
