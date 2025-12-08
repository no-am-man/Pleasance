
// src/firebase/firestore/use-collection.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  type Query,
  type DocumentData,
  onSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getFirebase } from '@/firebase/config';

interface UseCollectionOptions<T> {
  // You can add more options like custom converters here if needed
}

export function useCollection<T>(
  query: Query<DocumentData> | null,
  options?: UseCollectionOptions<T>
) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the query is null (e.g., dependencies not ready), do nothing
    if (!query) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(result);
        setIsLoading(false);
        setError(null);
      },
      (err: Error) => {
        console.error('useCollection snapshot error:', err);
        const permissionError = new FirestorePermissionError({
          path: (query as any)._query.path.segments.join('/'),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError); // Also set local error state
        setIsLoading(false);
        setData(null);
      }
    );

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [query]); // Re-run effect when the query object changes

  return { data, isLoading, error };
}
