
'use client';

import { AuthProvider } from '@/firebase/auth-provider';
import { Header } from '@/app/header';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { navLinks } from './header';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Sidebar } from '@/components/sidebar';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthProvider>
      <FirebaseErrorListener />
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-col flex-1 sm:pl-sidebar">
            <Header />
            <div className="fixed top-0 left-0 right-0 sm:left-sidebar z-40 h-12 bg-background/70 backdrop-blur-sm border-b flex justify-between items-center">
              <Breadcrumbs />
            </div>
            <main className="flex-grow pt-12">
              <div className="pt-4">{children}</div>
            </main>
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
