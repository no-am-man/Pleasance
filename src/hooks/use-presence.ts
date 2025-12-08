// src/hooks/use-presence.ts
'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp, goOnline, goOffline } from 'firebase/database';

export function usePresence() {
  const { user } = useUser();

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    
    const { firestore, database } = getFirebase();
    goOnline(database);

    const uid = user.uid;
    const userStatusDatabaseRef = ref(database, `/status/${uid}`);
    const userStatusFirestoreRef = doc(firestore, `/presence/${uid}`);

    const isOfflineForDatabase = {
        state: 'offline',
        last_changed: dbServerTimestamp(),
    };
    const isOnlineForDatabase = {
        state: 'online',
        last_changed: dbServerTimestamp(),
    };

    const connectedRef = ref(database, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
        const isConnected = snapshot.val() === true;
        
        if (isConnected) {
            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);
                
                const isOnlineForFirestore = {
                    userName: user.displayName || 'Anonymous',
                    avatarUrl: user.photoURL || '',
                    userId: user.uid,
                    lastSeen: serverTimestamp(),
                };

                // This is a fire-and-forget operation, not awaited.
                // It will be handled by the global error handler if it fails.
                setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true });
            });
        }
    });

    return () => {
      unsubscribe();
      // When the hook unmounts (e.g., user logs out, component unmounts),
      // we disconnect from the Realtime Database.
      // The `onDisconnect` handler will then take care of setting the status to offline.
      goOffline(database);
    };
  }, [user?.uid, user?.displayName, user?.photoURL]);
}
