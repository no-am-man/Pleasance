import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Header } from '@/components/header';
import Link from 'next/link';
import { ScrollIndicator } from '@/components/ui/scroll-indicator';

export const metadata: Metadata = {
  title: 'Pleasance',
  description: 'A federated universe for co-learning, creation, and fabrication.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <Header />
          <main className="flex-grow pt-16">{children}</main>
          <footer className="text-center p-4 border-t">
            <Link href="https://github.com/no-am-man/Pleasance" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
                Open Source Comunity? Fork me on git!
            </Link>
          </footer>
          <Toaster />
          <ScrollIndicator />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
