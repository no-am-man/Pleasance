
// src/hooks/use-presence.ts
'use client';

import { useEffect, useRef } from 'react';
import { useUser, firestore, database } from '@/firebase';
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
        if (!isConnected || isOnlineRef.current) {
            return;
        }
        
        isOnlineRef.current = true;

        // Set the onDisconnect hook on the Realtime Database
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            // If the onDisconnect is successfully set, update the user's state to online
            set(userStatusDatabaseRef, isOnlineForDatabase);

            // And update their presence in Firestore
            setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true });
        });
    });

    return () => {
        isOnlineRef.current = false;
        unsubscribe();
        // Clean up when component unmounts or user changes
        if (userStatusDatabaseRef) {
            set(userStatusDatabaseRef, isOfflineForDatabase);
        }
        if (userStatusFirestoreRef) {
            updateDoc(userStatusFirestoreRef, isOfflineForFirestore);
        }
    };
  }, [user]);
}
