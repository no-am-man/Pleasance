// src/components/PresenceBar.tsx
'use client';
import { usePresence } from '@/hooks/use-presence';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';

export function PresenceBar() {
  const { presentUsers, isLoading } = usePresence();
  const { user: currentUser } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full items-center px-4">
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center -space-x-2">
          {presentUsers.map((user) => {
            const isCurrentUser = user.userId === currentUser?.uid;
            return (
              <Tooltip key={user.userId}>
                <TooltipTrigger>
                    <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.name}{isCurrentUser ? ' (You)' : ''}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}

    