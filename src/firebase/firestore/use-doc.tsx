
// src/firebase/firestore/use-doc.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  type DocumentReference,
  type DocumentData,
  onSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getFirebase } from '@/firebase/config';

interface UseDocOptions<T> {
  // You can add more options like custom converters here if needed
}

export function useDoc<T>(
  docRef: DocumentReference<DocumentData> | null,
  options?: UseDocOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the docRef is null (e.g., dependencies not ready), do nothing
    if (!docRef) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const result = {
            id: snapshot.id,
            ...snapshot.data(),
          } as T;
          setData(result);
        } else {
          // Document does not exist
          setData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (err: Error) => {
        console.error('useDoc snapshot error:', err);
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError); // Also set local error state
        setIsLoading(false);
        setData(null);
      }
    );

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [docRef]); // Re-run effect when the docRef object changes

  return { data, isLoading, error };
}
