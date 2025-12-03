// src/hooks/use-presence.ts
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { database, firestore } from '@/firebase/config';
import { ref, onValue, onDisconnect, serverTimestamp, set } from 'firebase/database';
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
        if (!user) {
            setPresentUsers([]);
            setIsLoading(false);
            return;
        }

        const myConnectionsRef = ref(database, `users/${user.uid}`);
        const lastOnlineRef = ref(database, `lastOnline/${user.uid}`);
        const connectedRef = ref(database, '.info/connected');

        onValue(connectedRef, async (snap) => {
            if (snap.val() === true) {
                const profileRef = doc(firestore, 'community-profiles', user.uid);
                const profileSnap = await getDoc(profileRef);
                const profile = profileSnap.data();

                const conn = {
                    id: user.uid,
                    name: profile?.name || user.displayName || 'Anonymous',
                    avatarUrl: profile?.avatarUrl || user.photoURL || '',
                };
                set(myConnectionsRef, conn);

                onDisconnect(myConnectionsRef).remove();
                set(lastOnlineRef, serverTimestamp());
            }
        });

    }, [user]);

    useEffect(() => {
        const connectionsRef = ref(database, 'users');
        const unsubscribe = onValue(connectionsRef, (snapshot) => {
            const users = snapshot.val();
            const userList: PresentUser[] = users ? Object.values(users) : [];
            setPresentUsers(userList);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { presentUsers, isLoading };
}
