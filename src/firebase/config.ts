// src/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
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

type FirebaseServices = {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
    database: Database;
};

let firebaseServices: FirebaseServices | null = null;

// Idempotent function to get Firebase services
export function getFirebase(): FirebaseServices {
    if (firebaseServices) {
        return firebaseServices;
    }

    const apps = getApps();
    const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : apps[0];
    
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);
    const database = getDatabase(firebaseApp);

    firebaseServices = { firebaseApp, auth, firestore, storage, database };

    return firebaseServices;
}
