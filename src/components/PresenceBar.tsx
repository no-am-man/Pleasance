// src/components/PresenceBar.tsx
'use client';

import { usePresence, type PresentUser } from '@/hooks/use-presence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

function UserBubble({ user }: { user: PresentUser }) {
  return (
    <motion.div
      layoutId={user.id}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

export function PresenceBar() {
  const { presentUsers } = usePresence();

  if (!presentUsers || presentUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex h-full items-center justify-center gap-1">
      <AnimatePresence>
        {presentUsers.map((user) => (
          <UserBubble key={user.id} user={user} />
        ))}
      </AnimatePresence>
    </div>
  );
}
