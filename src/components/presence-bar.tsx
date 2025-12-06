
// src/components/presence-bar.tsx
'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/firebase';
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
        if (!firestore) return;
        
        // Query for users seen in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const presenceQuery = query(
            collection(firestore, 'presence'),
            where('lastSeen', '>', fiveMinutesAgo)
        );

        const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data() as Presence);
            setActiveUsers(users);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex items-center px-4 h-full">
            <div className="flex items-center -space-x-2">
                <TooltipProvider>
                    {activeUsers.slice(0, 10).map((user) => (
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
                {activeUsers.length > 10 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground border-2 border-background">
                        +{activeUsers.length - 10}
                    </div>
                )}
            </div>
        </div>
    );
}
