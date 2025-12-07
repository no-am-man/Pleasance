// src/components/PresenceManager.tsx
'use client';

import { usePresence } from '@/hooks/use-presence';

export function PresenceManager() {
  usePresence();
  return null; // This component does not render anything
}
