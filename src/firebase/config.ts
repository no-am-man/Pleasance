
// src/firebase/config.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

export const firebaseConfig = {
  "apiKey": "AIzaSyCMDygvQZnjbVLtr9RQn0IT2p4-STcHRk8",
  "appId": "1:865373195178:web:194231a9d92b92c16979d3",
  "authDomain": "studio-2441219031-242ae.firebaseapp.com",
  "databaseURL": "https://studio-2441219031-242ae-default-rtdb.firebaseio.com",
  "messagingSenderId": "865373195178",
  "projectId": "studio-2441219031-242ae",
  "storageBucket": "pleasance_bucket",
};

// Initialize Firebase
const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

// Export singleton instances of Firebase services.
export const auth: Auth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const database: Database = getDatabase(firebaseApp);
