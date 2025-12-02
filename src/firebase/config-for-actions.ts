// src/firebase/config-for-actions.ts
import { firebaseApp } from './config';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// This file is specifically for server-side actions.
// It does not include 'use client' and can be safely imported in server components.

export function initializeFirebase() {
  const app = firebaseApp;
  return {
      app,
      firestore: getFirestore(app),
      storage: getStorage(app),
  };
}
