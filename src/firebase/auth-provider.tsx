
// src/firebase/auth-provider.tsx
'use client';

import React, { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { getFirebase } from './config';
import { LoaderCircle } from 'lucide-react';

export interface AuthContextState {
  user: User | null;
  isUserLoading: boolean;
}

export const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
    // This is the single source of truth for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsUserLoading(true); // Set loading to true at the start of any auth change
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          // Wait for the session cookie to be set before updating the state
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          setUser(firebaseUser);
        } else {
          // Wait for the session cookie to be cleared before updating the state
          await fetch('/api/auth/session', { method: 'DELETE' });
          setUser(null);
        }
      } catch (e) {
        console.error("Session cookie operation failed:", e);
        // If session fails, still update user state to prevent being stuck in loading
        setUser(firebaseUser); 
      } finally {
        // Only set loading to false after all async operations for the auth change are complete
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const contextValue = useMemo(() => ({
    user,
    isUserLoading,
  }), [user, isUserLoading]);

  // We no longer show a global loader here. The `isUserLoading` flag is passed down
  // so that individual pages can decide how to handle the loading state. This avoids
  // re-rendering the entire app and potentially causing race conditions.

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
