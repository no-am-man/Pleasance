// src/components/PresenceBar.tsx
'use client';

import { usePresence } from '@/hooks/use-presence';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { LoaderCircle } from 'lucide-react';

export function PresenceBar() {
    const { presentUsers, isLoading } = usePresence();

    if (isLoading) {
        return (
            <div className="h-10 flex items-center justify-center">
                <LoaderCircle className="w-4 h-4 animate-spin" />
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="flex justify-center items-center gap-2 h-10">
                {presentUsers.map(user => (
                    <Tooltip key={user.id}>
                        <TooltipTrigger>
                            <Avatar className="h-8 w-8 border-2 border-green-500 shadow-md">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{user.name} is online</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}
