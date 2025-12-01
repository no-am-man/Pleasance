
// src/firebase/config-for-actions.ts
import { initializeApp as initializeAppLite, getApps as getAppsLite, getApp as getAppLite } from 'firebase/app';
import { getFirestore as getFirestoreLite } from 'firebase/firestore/lite';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// This file is specifically for server-side actions where the 'lite' packages are preferred.

export function initializeFirebase() {
  const app = getAppsLite().length ? getAppLite() : initializeAppLite(firebaseConfig);
  return {
      app,
      firestore: getFirestoreLite(app),
      storage: getStorage(app),
  };
}
