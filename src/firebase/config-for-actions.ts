
// src/firebase/config-for-actions.ts
import { initializeApp as initializeAppLite, getApps as getAppsLite, getApp as getAppLite } from 'firebase/app';
import { getFirestore as getFirestoreLite } from 'firebase/firestore/lite';
import { firebaseConfig } from './config';

// This file is specifically for server-side actions where the 'lite' packages are preferred.

export function initializeFirebase() {
  if (!getAppsLite().length) {
    const app = initializeAppLite(firebaseConfig);
    return {
        app,
        firestore: getFirestoreLite(app)
    };
  }
  const app = getAppLite();
  return {
    app,
    firestore: getFirestoreLite(app)
  };
}
