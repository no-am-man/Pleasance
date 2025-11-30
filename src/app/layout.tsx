import type {Metadata} from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Button } from '@/components/ui/button';
import { Home, Users } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'LinguaTune',
  description: 'Learn languages with AI-powered stories and karaoke-style reading.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <header className="container mx-auto max-w-4xl py-4">
            <nav className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/community">
                  <Users className="h-4 w-4 mr-2" />
                  Community
                </Link>
              </Button>
            </nav>
          </header>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
