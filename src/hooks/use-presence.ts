// src/hooks/use-presence.ts
'use client';

import { useState, useEffect } from 'react';
import { useUser, database, firestore } from '@/firebase';
import { ref, onValue, onDisconnect, serverTimestamp, set, off } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

type PresentUser = {
    id: string;
    name: string;
    avatarUrl: string;
};

export function usePresence() {
    const { user } = useUser();
    const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !database) {
            setIsLoading(false);
            setPresentUsers([]); // Clear users if not logged in
            return;
        }

        // Set the user's own presence status
        const myConnectionsRef = ref(database, `users/${user.uid}`);
        const lastOnlineRef = ref(database, `lastOnline/${user.uid}`);
        const connectedRef = ref(database, '.info/connected');

        const unsubscribeConnected = onValue(connectedRef, async (snap) => {
            if (snap.val() === true) {
                const profileRef = doc(firestore, 'community-profiles', user.uid);
                const profileSnap = await getDoc(profileRef);
                const profile = profileSnap.data();

                const conn = {
                    id: user.uid,
                    name: profile?.name || user.displayName || 'Anonymous',
                    avatarUrl: profile?.avatarUrl || user.photoURL || '',
                };
                
                await set(myConnectionsRef, conn);

                onDisconnect(myConnectionsRef).remove();
                onDisconnect(lastOnlineRef).set(serverTimestamp());
            }
        });
        
        // Listen for all present users
        const usersRef = ref(database, 'users');
        const unsubscribeUsers = onValue(usersRef, (snap) => {
            if (snap.exists()) {
                const users = snap.val();
                const userList = Object.values(users) as PresentUser[];
                setPresentUsers(userList);
            } else {
                setPresentUsers([]);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching present users:", error);
            setIsLoading(false);
        });


        // Cleanup function for all listeners
        return () => {
            unsubscribeConnected();
            off(usersRef, 'value', unsubscribeUsers);
            // Also ensure onDisconnect is cleaned up if user logs out manually
            const myRef = ref(database, `users/${user.uid}`);
            off(myRef);
        };

    }, [user]);


    return { presentUsers, isLoading };
}
