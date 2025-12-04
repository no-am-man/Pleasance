
// src/components/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Shield,
  UserCircle,
  UserX,
  Home,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/firebase/use-user';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { navLinks } from '@/app/header';
import { ScrollArea } from './ui/scroll-area';
import { ThemeSwitcher } from './theme-switcher';
import { Badge } from './ui/badge';

const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com'; // Founder email check

const adminLink = { href: '/admin', label: 'Admin', icon: Shield };


function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

function UserNav() {
  const { user } = useUser();
  const isFounder = user?.email === FOUNDER_EMAIL;

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <UserCircle className="h-5 w-5" />
        <span>Login</span>
      </Link>
    );
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center justify-start gap-3 w-full h-auto px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sidebar-foreground">{user.displayName || 'My Account'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="right" align="start" forceMount>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
          {isFounder && (
              <DropdownMenuItem asChild>
                  <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                  </Link>
              </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <ThemeSwitcher />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem 
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onSelect={(e) => isFounder && e.preventDefault()}
                disabled={isFounder}
            >
              <UserX className="mr-2 h-4 w-4" />
              <span>Exit Community</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. This will permanently delete your account, your profile,
            your communities, and remove you from any communities you have joined.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => console.log('Exit Community confirmed')} 
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Yes, Exit Community
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export function Sidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const isFounder = user?.email === FOUNDER_EMAIL;

    const allLinks = isFounder ? [...navLinks.filter(l => l.href !== '/wiki'), adminLink] : navLinks.filter(l => l.href !== '/wiki');

    return (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-sidebar flex-col border-r bg-sidebar sm:flex">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-8 w-8 text-primary" />
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-primary">Pleasance</span>
                        <Badge variant="outline" className="text-xs">
                          BETA
                        </Badge>
                    </div>
                </Link>
            </div>
            <ScrollArea className="flex-1">
                <nav className="grid items-start px-4 py-4 text-sm font-medium">
                    {allLinks.map((link) => (
                        <NavLink 
                            key={link.href}
                            {...link}
                            isActive={pathname === link.href}
                        />
                    ))}
                </nav>
            </ScrollArea>
            <div className="mt-auto p-4 border-t">
              <UserNav />
            </div>
        </aside>
    )
}
