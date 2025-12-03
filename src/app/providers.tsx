
'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { PresenceBar } from '@/components/PresenceBar';
import { navLinks } from './header';
import { Button } from '@/components/ui/button';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <FirebaseErrorListener />
      <Header />
      <main className="flex-grow pt-16">
        <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm">
            <PresenceBar />
        </div>
        <div className="pt-12">{children}</div>
      </main>
      <footer className="text-center p-4 border-t space-y-4">
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2">
            {navLinks.map(link => (
                <Button key={link.href} variant="link" asChild className="text-muted-foreground">
                    <Link href={link.href}>
                        {link.label}
                    </Link>
                </Button>
            ))}
        </div>
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
