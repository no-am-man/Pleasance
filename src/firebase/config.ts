// src/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all required client-side environment variables are set.
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  // In a client component, this will only log on the browser console.
  // The server will log a more detailed error if this code runs during SSR.
  console.error("Firebase client configuration is incomplete. Please check your NEXT_PUBLIC_ environment variables.");
}


type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
    database: Database;
};

// --- SINGLETON PATTERN ---
// This ensures that Firebase is initialized only once across the entire application.
const FirebaseServiceSingleton = (() => {
    let instance: FirebaseServices;

    function createInstance(): FirebaseServices {
        const apps = getApps();
        const app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
        
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        const storage = getStorage(app);
        const database = getDatabase(app);

        return { app, auth, firestore, storage, database };
    }

    return {
        getInstance: (): FirebaseServices => {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

// This function is the single source of truth for getting Firebase services.
export function getFirebase(): FirebaseServices {
    return FirebaseServiceSingleton.getInstance();
}
// --- END SINGLETON PATTERN ---


// For convenience, we can also export the individual services from the getter.
export const { firestore, auth, storage, database } = getFirebase();
