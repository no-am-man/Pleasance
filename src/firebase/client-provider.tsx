// src/firebase/client-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode, type DependencyList, useRef } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { LoaderCircle } from 'lucide-react';
import { auth } from '@/firebase/config'; // Directly import the initialized auth service

// Context state for user authentication
export interface AuthContextState {
  user: User | null;
  isUserLoading: boolean;
}

// React Context for Auth
export const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);

      // Only update the session cookie if the user's login state (UID) has actually changed.
      // This prevents unnecessary writes on every background token refresh.
      if (firebaseUser && firebaseUser.uid !== lastUid.current) {
        lastUid.current = firebaseUser.uid;
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
      } else if (!firebaseUser && lastUid.current !== null) {
        lastUid.current = null;
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {
          console.error("Failed to clear session cookie:", e);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    isUserLoading,
  }), [user, isUserLoading]);

  // Render a loading screen until initial auth state is resolved
  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * @returns {AuthContextState} Object with user and isUserLoading.
 */
export const useUser = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseClientProvider.');
  }
  return context;
};

// This hook is for memoizing Firebase queries/references.
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
