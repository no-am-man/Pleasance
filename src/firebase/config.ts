// src/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// IMPORTANT: REPLACE THESE PLACEHOLDER VALUES WITH YOUR ACTUAL FIREBASE CONFIG
export const firebaseConfig = {
  apiKey: "AIzaSyC5xXIFuwBzBCF08FpnEoNbrliZCYJgaFU",
  authDomain: "studio-2441219031-242ae.firebaseapp.com",
  projectId: "studio-2441219031-242ae",
  storageBucket: "studio-2441219031-242ae.appspot.com",
  messagingSenderId: "36997451383",
  appId: "1:36997451383:web:5317454867fa23126f3152",
};

// You can find these values in your Firebase project settings.
// Go to Project Settings (⚙️) > General > Your apps > Web app.

// Validation to ensure placeholder values are replaced.
if (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.startsWith("REPLACE_")
) {
  // This error will be thrown on the server during build and on the client at runtime.
  // It provides a clear, actionable message.
  throw new Error("Firebase client configuration is incomplete. Please update the placeholder values in 'src/firebase/config.ts' with your actual Firebase project credentials.");
}


type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
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

        return { app, auth, firestore };
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
export const { firestore, auth } = getFirebase();