
// src/firebase/config-for-actions.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// This file is specifically for server-side actions.
// It does not include 'use client' and can be safely imported in server components.

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
      app,
      firestore: getFirestore(app),
      storage: getStorage(app),
  };
}
