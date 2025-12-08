
// src/firebase/client-provider.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { getFirebase } from './config';
import { AuthProvider } from './auth-provider';
import { LoaderCircle } from 'lucide-react';
import { PresenceManager } from '@/components/PresenceManager';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    // getFirebase() initializes the app and returns the services
    const firebaseServices = getFirebase();
    setServices({
      app: firebaseServices.app,
      auth: firebaseServices.auth,
      firestore: firebaseServices.firestore,
    });
  }, []);

  if (!services) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <PresenceManager />
      {children}
    </AuthProvider>
  );
}
