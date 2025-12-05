
// src/components/layout.tsx
'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col sm:pl-[var(--sidebar-width)]">
        {/* Mobile Header */}
        <Header />
        {/* Desktop Header */}
        <header className="fixed top-0 z-40 hidden h-16 w-full items-center border-b bg-background/80 backdrop-blur-sm sm:left-[var(--sidebar-width)] sm:flex sm:w-[calc(100%-var(--sidebar-width))]">
          <Breadcrumbs />
        </header>
        <main className="flex-grow pt-16">
          <div className="pt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
