
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsUserLoading(true);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          setUser(firebaseUser);
        } catch (e) {
          console.error("Session cookie creation failed:", e);
          setUser(null);
        } finally {
            setIsUserLoading(false);
        }
      } else {
        await fetch('/api/auth/session', { method: 'DELETE' });
        setUser(null);
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const contextValue = useMemo(() => ({
    user,
    isUserLoading,
  }), [user, isUserLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
