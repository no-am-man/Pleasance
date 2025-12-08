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
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
    database: Database;
};

let firebaseServices: FirebaseServices | null = null;

// This function is the single source of truth for getting Firebase services.
// It ensures that Firebase is initialized only once.
export function getFirebase(): FirebaseServices {
    if (firebaseServices) {
        return firebaseServices;
    }

    const apps = getApps();
    const app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
    
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    const database = getDatabase(app);

    firebaseServices = { app, auth, firestore, storage, database };

    return firebaseServices;
}

// For convenience, we can also export the individual services from the getter.
// This maintains a similar import pattern for consumers but uses the managed instance.
export const { firestore, auth, storage, database } = getFirebase();
