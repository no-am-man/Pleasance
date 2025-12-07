
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
      let sessionOperationComplete = false;
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } else {
          await fetch('/api/auth/session', { method: 'DELETE' });
        }
      } catch (e) {
        console.error("Session cookie operation failed:", e);
      } finally {
        sessionOperationComplete = true;
      }
      
      // Update user state and loading state together.
      setUser(firebaseUser);
      // We are only done loading when the user is determined AND the session is set.
      if (sessionOperationComplete) {
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
