
'use client';

import { AuthProvider } from '@/firebase/auth-provider';
import { Header } from '@/app/header';
import { Toaster } from '@/components/ui/toaster';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Sidebar } from '@/components/sidebar';
import { LanguageProvider } from '@/components/language-provider';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 sm:pl-[var(--sidebar-width)]">
        <Header />
        <div className="fixed top-0 z-40 h-12 w-full border-b bg-background/70 backdrop-blur-sm sm:left-[var(--sidebar-width)] sm:w-[calc(100%-var(--sidebar-width))]">
          <Breadcrumbs />
        </div>
        <main className="flex-grow pt-16 sm:pt-12">
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
