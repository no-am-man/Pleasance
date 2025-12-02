import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  "apiKey": "AIzaSyCMDygvQZnjbVLtr9RQn0IT2p4-STcHRk8",
  "appId": "1:865373195178:web:194231a9d92b92c16979d3",
  "authDomain": "studio-2441219031-242ae.firebaseapp.com",
  "messagingSenderId": "865373195178",
  "projectId": "studio-2441219031-242ae",
  "storageBucket": "studio-2441219031-242ae.appspot.com"
};


let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

export function initializeFirebase() {
  if (!getApps().length) {
    try {
      app = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);

  return { app, auth, firestore, storage };
}
