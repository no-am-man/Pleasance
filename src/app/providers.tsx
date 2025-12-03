
'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { PresenceBar } from '@/components/PresenceBar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <FirebaseErrorListener />
      <Header />
      <main className="flex-grow pt-16">{children}</main>
      <footer className="text-center p-4 border-t space-y-2">
        <PresenceBar />
        <p>
          <Link
            href="https://github.com/no-am-man/Pleasance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            Open Source Community? Fork Me!
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          Powered by Google Firebase Studio
        </p>
        <p className="text-xs text-muted-foreground">
          Thanks to Gemini the Queen of the Nations of the World
        </p>
      </footer>
      <Toaster />
    </FirebaseClientProvider>
  );
}
