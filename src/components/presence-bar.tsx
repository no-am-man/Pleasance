// src/components/presence-bar.tsx
'use client';

import { useEffect, useState } from 'react';
import { getFirebase } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Presence = {
    userId: string;
    userName: string;
    avatarUrl: string;
    lastSeen: any;
};

export function PresenceBar() {
    const [activeUsers, setActiveUsers] = useState<Presence[]>([]);

    useEffect(() => {
        const { firestore } = getFirebase();
        if (!firestore) return;
        
        // Query for users seen in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const presenceQuery = query(
            collection(firestore, 'presence'),
            where('lastSeen', '>', fiveMinutesAgo)
        );

        const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                ...(doc.data() as Omit<Presence, 'userId'>),
                userId: doc.id,
              })) as Presence[];
            setActiveUsers(users);
        });

        return () => unsubscribe();
    }, []);

    // Filter out duplicate users based on userId, keeping only the first occurrence.
    const uniqueUsers = activeUsers.filter((user, index, self) =>
        index === self.findIndex((t) => t.userId === user.userId)
    );

    return (
        <div className="flex items-center px-4 h-full">
            <div className="flex items-center -space-x-2">
                <TooltipProvider>
                    {uniqueUsers.slice(0, 10).map((user) => (
                        <Tooltip key={user.userId}>
                            <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
                                    <AvatarImage src={user.avatarUrl} alt={user.userName} />
                                    <AvatarFallback>{user.userName?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{user.userName}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
                {uniqueUsers.length > 10 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground border-2 border-background">
                        +{uniqueUsers.length - 10}
                    </div>
                )}
            </div>
        </div>
    );
}
