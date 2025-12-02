
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode, type DependencyList } from 'react';
import { getFirebaseApp } from '@/firebase/config';
import { type FirebaseApp } from 'firebase/app';
import { type Auth, type User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';
import { type FirebaseStorage, getStorage } from 'firebase/storage';
import { LoaderCircle } from 'lucide-react';

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<{ app: FirebaseApp; auth: Auth; firestore: Firestore; storage: FirebaseStorage; } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase on the client
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    
    setServices({ app, auth, firestore, storage });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);

      // Manage server-side session cookie
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

  const contextValue = useMemo(() => {
    if (!services) return undefined;
    return {
      firebaseApp: services.app,
      auth: services.auth,
      firestore: services.firestore,
      storage: services.storage,
      user,
      isUserLoading: isAuthLoading,
    };
  }, [services, user, isAuthLoading]);

  // Render a loading screen until Firebase services and initial auth state are ready
  if (!contextValue || isAuthLoading) {
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
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseClientProvider.');
  }
  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
    const { storage } = useFirebase();
    return storage;
}

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
};
