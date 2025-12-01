import type {Metadata} from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Button } from '@/components/ui/button';
import { Home, Users, Sparkles, UserCircle, BookOpen, Warehouse } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Pleasance',
  description: 'A federated universe for co-learning, creation, and fabrication.',
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
              <Button asChild variant="ghost">
                <Link href="/story">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Nuncy
                </Link>
              </Button>
               <Button asChild variant="ghost">
                <Link href="/profile">
                  <UserCircle className="h-4 w-4 mr-2" />
                  My Profile
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/fabrication">
                  <Warehouse className="h-4 w-4 mr-2" />
                  Fabrication
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
