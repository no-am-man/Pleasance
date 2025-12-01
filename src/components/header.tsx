'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookOpen,
  Home,
  Info,
  Menu,
  UserCircle,
  Users,
  Warehouse,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/story', label: 'Burlington Edge', icon: BookOpen },
  { href: '/fabrication', label: 'Fabrication', icon: Warehouse },
  { href: '/treasury', label: 'Treasury', icon: Banknote },
  { href: '/wiki', label: 'Wiki', icon: Info },
  { href: '/profile', label: 'My Profile', icon: UserCircle, isProfile: true },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isMobile,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} legacyBehavior passHref>
      <a
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          isMobile ? 'text-base' : ''
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <span className="text-lg font-semibold text-primary">Pleasance</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-2 md:flex">
        {navLinks
          .filter((link) => !link.isProfile)
          .map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        <div className="w-px h-6 bg-border mx-2"></div>
         <NavLink {...navLinks.find((link) => link.isProfile)!} />
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="top">
            <div className="flex flex-col gap-4 p-4">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo className="h-8 w-8 text-primary" />
                <span className="text-lg font-semibold text-primary">
                  Pleasance
                </span>
              </Link>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink key={link.href} {...link} isMobile />
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
