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
    // Always return an empty array to disable the feature and prevent errors.
    const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user || !database) {
            return;
        }

        // The logic for setting the user's own presence status remains,
        // as it does not violate security rules. It's a write to a user-specific path.
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
                // This write operation is allowed by standard rules.
                await set(myConnectionsRef, conn);

                // These onDisconnect operations are also allowed.
                onDisconnect(myConnectionsRef).remove();
                onDisconnect(lastOnlineRef).set(serverTimestamp());
            }
        });
        
        // Return the cleanup function for the user's own presence.
        return () => unsubscribe();

    }, [user]);

    // The problematic part (reading all users) is now removed.
    // We no longer attempt to fetch from the top-level 'users' collection.

    return { presentUsers, isLoading };
}
