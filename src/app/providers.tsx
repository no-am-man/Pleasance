
'use client';

import { AuthProvider } from '@/firebase/auth-provider';
import { Header } from '@/app/header';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { navLinks } from './header';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PresenceBar } from '@/components/PresenceBar';
import { Breadcrumbs } from '@/components/breadcrumbs';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthProvider>
      <Header />
      <div className="fixed top-16 left-0 right-0 z-40 h-12 bg-background/70 backdrop-blur-sm border-b">
        <Breadcrumbs />
      </div>
      <div className="fixed top-28 left-0 right-0 z-40 h-12 bg-background/70 backdrop-blur-sm border-b">
        <PresenceBar />
      </div>
      <main className="flex-grow pt-40 pb-40">
        <div className="pt-4">{children}</div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="h-1 w-full ant-trail" />
        <div className="text-center p-4 space-y-4">
            
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2">
                {navLinks.map(link => {
                    const isActive = pathname.startsWith(link.href) && (link.href !== '/' || pathname === '/');
                    return (
                        <Button key={link.href} variant="link" asChild className={cn("h-auto py-1 px-2", isActive ? "text-primary" : "text-muted-foreground")}>
                            <Link href={link.href}>
                                {link.label}
                            </Link>
                        </Button>
                    )
                })}
            </div>
            <p>
            <Link
                href="https://github.com/no-am-man/Pleasance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline text-sm"
            >
                Open Source Community? Fork Me!
            </Link>
            </p>
            <p className="text-xs text-muted-foreground">
            Powered by Google Firebase Studio
            </p>
        </div>
      </footer>
      <Toaster />
    </AuthProvider>
  );
}
