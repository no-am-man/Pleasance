
'use client';

import { AuthProvider } from '@/firebase/auth-provider';
import { Header } from '@/app/header';
import { Toaster } from '@/components/ui/toaster';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Sidebar } from '@/components/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider, useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className={cn(
        "flex flex-col flex-1",
        direction === 'rtl' ? 'sm:mr-sidebar' : 'sm:pl-sidebar'
      )}>
        <Header />
        <div className={cn(
          "fixed top-0 z-40 h-12 bg-background/70 backdrop-blur-sm border-b flex justify-between items-center",
          direction === 'rtl' ? "left-0 right-sidebar" : "right-0 sm:left-sidebar"
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
      <ThemeProvider>
        <LanguageProvider>
          <FirebaseErrorListener />
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
