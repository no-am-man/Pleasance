// src/components/layout.tsx
'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { cn } from '@/lib/utils';
import { useLanguage } from './language-provider';
import { useUser } from '@/firebase';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();
  const { isUserLoading } = useUser();

  return (
    <div className={cn("flex min-h-screen w-full", direction === 'rtl' ? 'rtl' : 'ltr')}>
      <Sidebar />
      <div className="flex flex-1 flex-col sm:ml-[var(--sidebar-margin-left)] sm:mr-[var(--sidebar-margin-right)]">
        <Header />
        <main className="flex-grow pt-16">
          <div className="pt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
