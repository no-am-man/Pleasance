
// src/hooks/use-presence.ts
'use client';

import { useEffect } from 'react';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp, goOffline, goOnline } from 'firebase/database';

export function usePresence() {
  const { user } = useUser();

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    
    const { firestore, database } = getFirebase();
    goOnline(database); // Ensure connection is active

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

    // On cleanup, unsubscribe the listener and explicitly go offline.
    return () => {
      unsubscribe();
      // This is the crucial part. When the component unmounts (e.g., at the end of a test),
      // we immediately disconnect from the Realtime Database. The onDisconnect handler 
      // configured above will then execute on the Firebase server, setting the user's
      // status to 'offline' correctly and reliably without leaving pending async operations.
      goOffline(database);
    };
  }, [user?.uid, user?.displayName, user?.photoURL]);
}
