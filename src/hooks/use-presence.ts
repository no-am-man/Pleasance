// src/hooks/use-presence.ts
'use client';

import { useEffect, useRef } from 'react';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp } from 'firebase/database';

export function usePresence() {
  const { user } = useUser();
  const isOnlineRef = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    const { firestore, database } = getFirebase();

    const uid = user.uid;
    const userStatusDatabaseRef = ref(database, `/status/${uid}`);
    const userStatusFirestoreRef = doc(firestore, `/presence/${uid}`);

    // Firestore timestamp object
    const firestoreTimestamp = serverTimestamp();

    const isOfflineForFirestore = {
        lastSeen: firestoreTimestamp,
    };
    const isOnlineForFirestore = {
        userName: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || '',
        userId: user.uid,
        lastSeen: firestoreTimestamp,
    };

    // Realtime Database timestamp object
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
        if (!isConnected && isOnlineRef.current) {
            // Fallback for abrupt disconnection.
            // No write operations here, onDisconnect handles it.
            isOnlineRef.current = false;
            return;
        }

        if (isConnected) {
            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);
                setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true }).catch(error => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userStatusFirestoreRef.path,
                        operation: 'write',
                        requestResourceData: isOnlineForFirestore
                    }));
                });
                isOnlineRef.current = true;
            });
        }
    });

    return () => {
      // ONLY unsubscribe the listener. Do not perform async writes in cleanup.
      // The onDisconnect handler is sufficient for managing offline state.
      unsubscribe();
    };
  }, [user]);
}
