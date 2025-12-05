
'use client';

import { AuthProvider } from '@/firebase/auth-provider';
import { Header } from '@/app/header';
import { Toaster } from '@/components/ui/toaster';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Sidebar } from '@/components/sidebar';
import { LanguageProvider, useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';
import { ThemeProvider as NextThemesProvider } from 'next-themes'

function AppLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className={cn(
        "flex flex-col flex-1",
        direction === 'rtl' ? 'sm:mr-[var(--sidebar-width)]' : 'sm:pl-[var(--sidebar-width)]'
      )}>
        <Header />
        <div className={cn(
          "fixed top-0 z-40 h-12 bg-background/70 backdrop-blur-sm border-b flex justify-between items-center",
          direction === 'rtl' ? "left-0 right-[var(--sidebar-width)]" : "right-0 sm:left-[var(--sidebar-width)]"
        )}>
          <Breadcrumbs />
        </div>
        <main className="flex-grow pt-12">
          <div className="pt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}


export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <AuthProvider>
      <LanguageProvider>
        <FirebaseErrorListener />
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </LanguageProvider>
    </AuthProvider>
  );
}
