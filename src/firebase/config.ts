
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

export const firebaseConfig = {
  "apiKey": "AIzaSyCMDygvQZnjbVLtr9RQn0IT2p4-STcHRk8",
  "appId": "1:865373195178:web:194231a9d92b92c16979d3",
  "authDomain": "studio-2441219031-242ae.firebaseapp.com",
  "messagingSenderId": "865373195178",
  "projectId": "studio-2441219031-242ae",
  "storageBucket": "studio-2441219031-242ae.appspot.com"
};


/**
 * Gets the Firebase app instance. Initializes it if it doesn't exist.
 * This is safe to call on both server and client.
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}
