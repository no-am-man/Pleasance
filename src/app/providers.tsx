
'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from '@/components/language-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <FirebaseClientProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
