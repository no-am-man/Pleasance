
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
            // If the user is marked as online in our local state, update Firestore as they go offline.
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

            set(userStatusDatabaseRef, isOnlineForDatabase);

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
        unsubscribe();
        isOnlineRef.current = false;
        // Clean up on unmount
        if (userStatusDatabaseRef) {
            set(userStatusDatabaseRef, isOfflineForDatabase);
        }
        if (userStatusFirestoreRef) {
            setDoc(userStatusFirestoreRef, isOfflineForFirestore, { merge: true }).catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userStatusFirestoreRef.path,
                    operation: 'update',
                    requestResourceData: isOfflineForFirestore
                }));
            });
        }
    };
  }, [user]);
}

