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
  const [sessionSet, setSessionSet] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setSessionSet(false); // Reset session status on auth change

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
        } finally {
            setSessionSet(true);
        }
      } else {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {
          console.error("Failed to clear session cookie:", e);
        } finally {
            setSessionSet(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only set loading to false when the user object is determined AND the session operation is complete.
    if (sessionSet) {
        setIsUserLoading(false);
    }
  }, [user, sessionSet]);


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
