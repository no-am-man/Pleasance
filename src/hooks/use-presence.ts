
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

    const connectedRef = ref(database, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
        const isConnected = snapshot.val() === true;
        if (!isConnected) {
            if (isOnlineRef.current) {
                setDoc(userStatusFirestoreRef, isOfflineForFirestore, { merge: true }).catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userStatusFirestoreRef.path,
                        operation: 'update',
                        requestResourceData: isOfflineForFirestore
                    }));
                });
                isOnlineRef.current = false;
            }
            return;
        }
        
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
    });

    return () => {
        unsubscribe();
        if (isOnlineRef.current) {
            // Use set without merge: true to just update the offline status
            set(userStatusDatabaseRef, isOfflineForDatabase);
            // Update only lastSeen on disconnect to preserve user info
            updateDoc(userStatusFirestoreRef, { lastSeen: firestoreTimestamp }).catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userStatusFirestoreRef.path,
                    operation: 'update',
                    requestResourceData: { lastSeen: 'SERVER_TIMESTAMP' }
                }));
            });
            isOnlineRef.current = false;
        }
    };
  }, [user]);
}


