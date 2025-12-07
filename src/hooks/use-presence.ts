// src/hooks/use-presence.ts
'use client';

import { useEffect, useRef } from 'react';
import { useUser, firestore, database, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp } from 'firebase/database';

export function usePresence() {
  const { user } = useUser();
  const isOnlineRef = useRef(false);

  useEffect(() => {
    if (!user || !firestore || !database) {
      return;
    }

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

    // Use '.info/connected' to monitor connection state
    const connectedRef = ref(database, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, async (snapshot) => {
        const isConnected = snapshot.val() === true;
        if (!isConnected) {
            if (isOnlineRef.current) {
                try {
                    await setDoc(userStatusFirestoreRef, isOfflineForFirestore, { merge: true });
                } catch (error) {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userStatusFirestoreRef.path,
                        operation: 'update',
                        requestResourceData: isOfflineForFirestore
                    }));
                }
                isOnlineRef.current = false;
            }
            return;
        }
        
        try {
            await onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase);
            await set(userStatusDatabaseRef, isOnlineForDatabase);
            await setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true });
            isOnlineRef.current = true;
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userStatusFirestoreRef.path,
                operation: 'write',
                requestResourceData: isOnlineForFirestore
            }));
        }
    });

    return () => {
        unsubscribe(); // Detach the listener
        isOnlineRef.current = false;
        // Clean up on unmount or user change
        set(userStatusDatabaseRef, isOfflineForDatabase);
        setDoc(userStatusFirestoreRef, isOfflineForFirestore, { merge: true }).catch(error => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userStatusFirestoreRef.path,
                operation: 'update',
                requestResourceData: isOfflineForFirestore
            }));
        });
    };
  }, [user]);
}
