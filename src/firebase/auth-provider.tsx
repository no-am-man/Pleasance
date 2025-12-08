// src/firebase/auth-provider.tsx
'use client';

import React, { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config'; // Import the stable auth instance
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

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
