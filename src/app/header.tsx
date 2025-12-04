
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookOpen,
  Home,
  LogOut,
  Menu,
  Shield,
  UserCircle,
  Users,
  Warehouse,
  Sparkles,
  Bug,
  UserX,
  Bot,
  DollarSign,
  Landmark,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase/use-user';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ThemeSwitcher } from '@/components/theme-switcher';


const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com'; // Founder email check

export const navLinks = [
  { href: '/', label: 'Community', icon: Users },
  { href: '/museum', label: 'Museum', icon: Landmark },
  { href: '/svg3d', label: 'AI Workshop', icon: Sparkles },
  { href: '/conductor', label: 'Conductor', icon: Bot },
  { href: '/story', label: 'Nuncy Lingua', icon: BookOpen },
  { href: '/fabrication', label: 'Fabrication', icon: Warehouse },
  { href: '/treasury', label: 'Treasury', icon: Banknote },
  { href: '/roadmap', label: 'Roadmap', icon: KanbanIcon },
  { href: '/bugs', label: 'Bug Tracker', icon: Bug },
  { href: '/pricing', label: 'Pricing', icon: DollarSign },
];

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


export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const isFounder = user?.email === FOUNDER_EMAIL;

  const allLinks = isFounder ? [...navLinks, adminLink] : navLinks;

  const handleSignOut = async () => {
    await signOut(auth);
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">Pleasance</span>
          <Badge variant="outline" className="text-xs">
            BETA
          </Badge>
        </div>
      </Link>
      
      <AlertDialog>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar text-sidebar-foreground p-0">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Logo className="h-8 w-8 text-primary" />
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start p-4 text-sm font-medium">
                        {allLinks.map((link) => (
                        <NavLink
                            key={link.href}
                            {...link}
                            isActive={pathname === link.href}
                        />
                        ))}
                    </nav>
                </div>
                 <div className="mt-auto p-4 border-t">
                    {user ? (
                        <div className="space-y-2">
                            <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{user.displayName}</span>
                            </Link>
                             <div className="px-3">
                                <ThemeSwitcher />
                            </div>
                            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-3 px-3">
                                <LogOut className="h-5 w-5" /> Sign Out
                            </Button>
                             <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isFounder}>
                                    <UserX className="h-5 w-5" /> Exit Community
                                </Button>
                            </AlertDialogTrigger>
                        </div>
                    ) : (
                        <NavLink href="/login" label="Login" icon={UserCircle} isActive={false} />
                    )}
                 </div>
            </SheetContent>
        </Sheet>
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
    </header>
  );
}
