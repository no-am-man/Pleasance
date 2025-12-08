// src/components/layout.tsx
'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { cn } from '@/lib/utils';
import { useLanguage } from './language-provider';
import { PresenceManager } from './PresenceManager';
import { useUser } from '@/firebase';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();
  const { isUserLoading } = useUser();

  return (
    <div className={cn("flex min-h-screen w-full", direction === 'rtl' ? 'rtl' : 'ltr')}>
      {!isUserLoading && <PresenceManager />}
      <Sidebar />
      <div className="flex flex-1 flex-col sm:ml-[var(--sidebar-margin-left)] sm:mr-[var(--sidebar-margin-right)]">
        <Header />
        <header className="fixed top-0 z-40 hidden h-16 w-full items-center border-b bg-background/80 backdrop-blur-sm sm:flex sm:w-[calc(100%-var(--sidebar-width))]">
          <div className="flex h-full w-full items-center">
            <Breadcrumbs />
          </div>
        </header>
        <main className="flex-grow pt-16">
          <div className="pt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
