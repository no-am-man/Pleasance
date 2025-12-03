'use client';

import { useContext } from 'react';
import { FirebaseContext, type FirebaseContextState } from './client-provider';

export function useUser() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseClientProvider');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
}
