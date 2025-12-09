// src/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyC5xXIFuwBzBCF08FpnEoNbrliZCYJgaFU",
  authDomain: "studio-2441219031-242ae.firebaseapp.com",
  projectId: "studio-2441219031-242ae",
  storageBucket: "studio-2441219031-242ae.appspot.com",
  messagingSenderId: "36997451383",
  appId: "1:36997451383:web:5317454867fa23126f3152",
};

// This error is a safeguard. If you see this, you need to replace the placeholder values above.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("REPLACE_")) {
  throw new Error("Firebase client configuration is incomplete. Please update the placeholder values in 'src/firebase/config.ts' with your actual Firebase project credentials.");
}

type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    database: Database;
    storage: FirebaseStorage;
};

// --- SINGLETON PATTERN ---
const FirebaseServiceSingleton = (() => {
    let instance: FirebaseServices | undefined;

    function createInstance(): FirebaseServices {
        const apps = getApps();
        const app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
        
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        const database = getDatabase(app);
        const storage = getStorage(app);

        return { app, auth, firestore, database, storage };
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

export function getFirebase(): FirebaseServices {
    return FirebaseServiceSingleton.getInstance();
}
// --- END SINGLETON PATTERN ---

// For convenience, we can also export the individual services.
export const { firestore, auth } = getFirebase();
