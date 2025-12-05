import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '@/components/layout';
import { Inter, Lexend } from 'next/font/google'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: 'Pleasance | A Federation of Social Communities',
  description: 'A Federation of Social Communities for communion, co-learning, and creation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable,
        lexend.variable
      )}>
          <Providers>
            <AppLayout>
              {children}
            </AppLayout>
          </Providers>
      </body>
    </html>
  );
}
