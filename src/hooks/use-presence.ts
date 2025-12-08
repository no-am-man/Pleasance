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
    if (!user?.uid) {
      return;
    }
    const { firestore, database } = getFirebase();

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
        
        // This check prevents redundant writes if the connection status hasn't actually changed.
        if (isConnected === isOnlineRef.current) {
            return;
        }

        if (isConnected) {
            // Set the onDisconnect handler *before* setting the online status.
            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                // Once the disconnect is guaranteed, set the current status to online.
                set(userStatusDatabaseRef, isOnlineForDatabase);
                
                // Also update Firestore to show this user is online.
                const isOnlineForFirestore = {
                    userName: user.displayName || 'Anonymous',
                    avatarUrl: user.photoURL || '',
                    userId: user.uid,
                    lastSeen: serverTimestamp(),
                };

                // Asynchronously update Firestore without blocking.
                setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true }).catch(error => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userStatusFirestoreRef.path,
                        operation: 'write',
                        requestResourceData: isOnlineForFirestore
                    }));
                });
            });
            isOnlineRef.current = true;
        } else {
            // The onDisconnect handler will manage the offline status.
            isOnlineRef.current = false;
        }
    });

    // The cleanup function should only detach the listener.
    // The onDisconnect handler will take care of the database updates when the user disconnects.
    return () => {
      unsubscribe();
    };
  }, [user?.uid, user?.displayName, user?.photoURL]); // Depend on specific primitive values from the user object
}
