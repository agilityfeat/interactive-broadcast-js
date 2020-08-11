// @flow
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';
import firebaseConfig from '../config/firebase';

firebase.initializeApp(firebaseConfig);

export const getRef = (path: string): firebase.database.ref => {
  firebase.database().ref(path);
};

export default firebase;

