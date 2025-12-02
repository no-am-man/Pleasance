'use client';

// Export config and services directly for use in hooks and components
export { firebaseApp, auth, firestore, storage } from './config';

// Export provider and user-related hooks
export * from './client-provider';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
