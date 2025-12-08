
// src/firebase/index.ts
'use client';
import { useMemo, type DependencyList } from 'react';

// Export config and services directly for use in hooks and components
export { getFirebase } from './config';
export { FirebaseClientProvider } from './client-provider';

// Export database update helpers
export * from './db-updates';
export * from './non-blocking-updates';

// Export error handling utilities
export * from './errors';
export * from './error-emitter';

// Explicitly export the user hook
export { useUser } from './use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';


// A hook to memoize Firebase queries.
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
