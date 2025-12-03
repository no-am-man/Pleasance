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
            setPresentUsers([]);
            setIsLoading(false);
            return;
        }

        const myConnectionsRef = ref(database, `users/${user.uid}`);
        const lastOnlineRef = ref(database, `lastOnline/${user.uid}`);
        const connectedRef = ref(database, '.info/connected');

        const unsubscribe = onValue(connectedRef, async (snap) => {
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
        
        return () => unsubscribe();

    }, [user]);

    useEffect(() => {
        if (!database) {
            setIsLoading(false);
            return;
        }
        const connectionsRef = ref(database, 'users');
        
        const unsubscribe = onValue(connectionsRef, (snapshot) => {
            const users = snapshot.val();
            const userList: PresentUser[] = users ? Object.values(users) : [];
            setPresentUsers(userList);
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to listen for present users:", error);
            setIsLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => off(connectionsRef);
        
    }, []);

    return { presentUsers, isLoading };
}
