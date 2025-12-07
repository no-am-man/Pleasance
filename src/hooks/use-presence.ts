
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
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
        const isConnected = snapshot.val() === true;
        if (!isConnected) {
            // We're not connected, so we can't do anything.
            // onDisconnect will handle this case when connection is lost.
            return;
        }
        
        // Use a ref to prevent setting up multiple onDisconnect listeners
        // if this callback fires multiple times.
        if (isOnlineRef.current) {
            return;
        }

        // Set up the onDisconnect hook. This will trigger when the client disconnects.
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            isOnlineRef.current = true;
            // Now that onDisconnect is set, we can safely set the current state to online.
            set(userStatusDatabaseRef, isOnlineForDatabase);

            // Also update Firestore. Use set with merge to handle creation/update.
            setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true })
              .catch(error => {
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
        // Explicitly set the user to offline when the hook unmounts (e.g., page navigation)
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
