// src/hooks/use-presence.ts
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, collection, onSnapshot, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';

type PresentUser = {
  userId: string;
  name: string;
  avatarUrl?: string;
  lastSeen: any;
};

export function usePresence() {
  const { user } = useUser();
  const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    // Listen for changes to the presence collection
    const presenceCol = collection(firestore, 'presence');
    const unsubscribe = onSnapshot(presenceCol, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as PresentUser);
      // Filter out users who haven't been seen in the last 2 minutes
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      const recentUsers = users.filter(u => u.lastSeen && u.lastSeen.toMillis() > twoMinutesAgo);
      setPresentUsers(recentUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Presence snapshot error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !firestore) {
      return;
    }

    const userPresenceDoc = doc(firestore, 'presence', user.uid);

    // Set user's presence
    const setUserPresence = () => {
      setDoc(userPresenceDoc, {
        userId: user.uid,
        name: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || '',
        lastSeen: serverTimestamp(),
      }, { merge: true });
    };

    setUserPresence();

    // Update timestamp every minute
    const interval = setInterval(setUserPresence, 60000);

    // Set up beforeunload event to remove presence
    const handleBeforeUnload = () => {
       // This is a best-effort attempt. Firestore's offline capability
       // might delay the delete, but it's better than nothing.
       deleteDoc(userPresenceDoc);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Clean up user's presence doc on dismount/sign-out
      deleteDoc(userPresenceDoc);
    };
  }, [user]);

  return { presentUsers, isLoading };
}

    