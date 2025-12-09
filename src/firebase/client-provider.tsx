// src/firebase/client-provider.tsx
'use client';

import { ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { getFirebase } from './config';
import { AuthProvider } from './auth-provider';
import { PresenceManager } from '@/components/PresenceManager';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // getFirebase() now handles the singleton instance, so we can call it directly.
  // There is no need for useState or useEffect here anymore.
  const { app, auth, firestore } = getFirebase();

  return (
    <AuthProvider>
      <PresenceManager />
      {children}
    </AuthProvider>
  );
}
