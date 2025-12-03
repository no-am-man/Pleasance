// src/hooks/use-presence.ts
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  Timestamp,
  setDoc,
} from 'firebase/firestore';

export type PresentUser = {
  id: string;
  name: string;
  avatarUrl: string;
};

export function usePresence() {
  const { user } = useUser();
  const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setPresentUsers([]);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(firestore, 'presence', user.uid);

    // Set user as present
    setDoc(userDocRef, {
      name: user.displayName,
      avatarUrl: user.photoURL,
      lastSeen: serverTimestamp(),
    }, { merge: true });

    // Set an interval to update the timestamp, keeping the user "online"
    const intervalId = setInterval(() => {
      setDoc(userDocRef, { lastSeen: serverTimestamp() }, { merge: true });
    }, 60 * 1000); // Every 60 seconds

    // Listen for changes in the presence collection
    const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    const presenceQuery = query(
      collection(firestore, 'presence'),
      where('lastSeen', '>', fiveMinutesAgo)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const users: PresentUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.name,
          avatarUrl: data.avatarUrl,
        });
      });
      setPresentUsers(users);
      setIsLoading(false);
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
      // Note: We are not setting the user as offline on unmount
      // because it's unreliable. The timestamp check handles this.
    };
  }, [user]);

  return { presentUsers, isLoading };
}
