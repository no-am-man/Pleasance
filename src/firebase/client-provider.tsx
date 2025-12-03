// src/firebase/client-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode, type DependencyList } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { LoaderCircle } from 'lucide-react';
import { auth, firebaseApp, firestore, storage } from '@/firebase/config';
import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { type FirebaseStorage } from 'firebase/storage';

// Define a context for all Firebase services
interface FirebaseContextState {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
}

// React Context for all of Firebase
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- Create the service instances ONCE, outside the component ---
// This is the critical change to ensure stability.
const firebaseServices = {
    app: firebaseApp,
    auth: auth,
    firestore: firestore,
    storage: storage,
};

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } catch (e) {
          console.error("Failed to set session cookie:", e);
        }
      } else {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {
          console.error("Failed to clear session cookie:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);
  
  // The context value now combines the STABLE services with the DYNAMIC user state.
  // This useMemo will only re-run when the user's auth state changes.
  const contextValue = useMemo(() => ({
    ...firebaseServices,
    user,
    isUserLoading,
  }), [user, isUserLoading]);

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * General hook to access all Firebase services.
 * @returns {FirebaseContextState} The full Firebase context.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseClientProvider.');
  }
  return context;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * @returns {{ user: User | null, isUserLoading: boolean }} Object with user and loading state.
 */
export const useUser = (): { user: User | null; isUserLoading: boolean } => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseClientProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
