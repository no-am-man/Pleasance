'use client';
import { useMemo, type DependencyList } from 'react';

// Export config and services directly for use in hooks and components
export { firebaseApp, auth, firestore, storage, database } from './config';

// Export provider and user-related hooks
export * from './client-provider';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Explicitly export the listener and hook
export { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
export { useUser } from '@/firebase/use-user';


// A hook to memoize Firebase queries.
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}
