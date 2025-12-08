// src/hooks/use-presence.ts
'use client';

import { useEffect, useRef } from 'react';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp } from 'firebase/database';

export function usePresence() {
  const { user } = useUser();

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
        
        if (isConnected) {
            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);
                
                const isOnlineForFirestore = {
                    userName: user.displayName || 'Anonymous',
                    avatarUrl: user.photoURL || '',
                    userId: user.uid,
                    lastSeen: serverTimestamp(),
                };

                setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true }).catch(error => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userStatusFirestoreRef.path,
                        operation: 'write',
                        requestResourceData: isOnlineForFirestore
                    }));
                });
            });
        }
    });

    return () => {
      // CORRECT CLEANUP: Only detach the listener.
      // The onDisconnect handler is responsible for setting the user to offline when they truly disconnect.
      unsubscribe();
    };
  // Stabilize dependencies to only re-run when specific user properties change.
  }, [user?.uid, user?.displayName, user?.photoURL]);
}
