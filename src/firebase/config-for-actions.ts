
// src/firebase/config-for-actions.ts
import { getFirebaseApp } from './config';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// This file is specifically for server-side actions.
// It does not include 'use client' and can be safely imported in server components.

export function initializeFirebase() {
  const app = getFirebaseApp();
  return {
      app,
      firestore: getFirestore(app),
      storage: getStorage(app),
  };
}
