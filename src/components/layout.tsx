// src/components/layout.tsx
'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { cn } from '@/lib/utils';
import { useLanguage } from './language-provider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className={cn("flex flex-1 flex-col", direction === 'rtl' ? 'sm:pr-[var(--sidebar-width)]' : 'sm:pl-[var(--sidebar-width)]')}>
        <Header />
        <header className={cn(
            "fixed top-0 z-40 hidden h-16 w-full items-center border-b bg-background/80 backdrop-blur-sm sm:flex",
            direction === 'rtl' ? 'sm:right-[var(--sidebar-width)] sm:w-[calc(100%-var(--sidebar-width))]' : 'sm:left-[var(--sidebar-width)] sm:w-[calc(100%-var(--sidebar-width))]'
        )}>
          <Breadcrumbs />
        </header>
        <main className="flex-grow pt-16">
          <div className="pt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
