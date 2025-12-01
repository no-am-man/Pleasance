
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookOpen,
  ChevronDown,
  Home,
  Info,
  Menu,
  UserCircle,
  Users,
  Warehouse,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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
  isActive,
  isDropdown = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isDropdown?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        isDropdown ? 'w-full' : ''
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">Pleasance</span>
          <Badge variant="outline" className="text-xs">BETA</Badge>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-2 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              Menu <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {navLinks
              .filter((link) => !link.isProfile)
              .map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <NavLink
                    {...link}
                    isActive={pathname === link.href}
                    isDropdown
                  />
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-2"></div>
        <NavLink
          {...navLinks.find((link) => link.isProfile)!}
          isActive={pathname === '/profile'}
        />
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
            <SheetHeader>
              <SheetTitle className="sr-only">Main Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-4">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo className="h-8 w-8 text-primary" />
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-primary">
                    Pleasance
                    </span>
                    <Badge variant="outline" className="text-xs">BETA</Badge>
                </div>
              </Link>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    isActive={pathname === link.href}
                  />
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
