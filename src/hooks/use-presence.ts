
// src/hooks/use-presence.ts
'use client';

import { useEffect, useRef } from 'react';
import { useUser, firestore, database, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
        const isConnected = snapshot.val() === true;
        if (!isConnected) {
            // We're not connected, so we can't do anything.
            // onDisconnect will handle this when connection is lost.
            return;
        }
        
        // Use a ref to avoid re-running this on every user object change if already online.
        if (isOnlineRef.current) {
            return;
        }

        // Set the onDisconnect hook on the Realtime Database.
        // This should be done only once per session.
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            isOnlineRef.current = true;
            // If the onDisconnect is successfully set, update the user's state to online
            set(userStatusDatabaseRef, isOnlineForDatabase);

            // And update their presence in Firestore (with error handling)
            setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true }).catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userStatusFirestoreRef.path,
                    operation: 'write',
                    requestResourceData: isOnlineForFirestore
                }));
            });
        });
    });

    return () => {
        isOnlineRef.current = false;
        unsubscribe();
        // Clean up when component unmounts or user changes by setting status to offline.
        // This covers cases like signing out.
        if (userStatusDatabaseRef) {
            set(userStatusDatabaseRef, isOfflineForDatabase);
        }
        if (userStatusFirestoreRef) {
            updateDoc(userStatusFirestoreRef, isOfflineForFirestore).catch(error => {
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
