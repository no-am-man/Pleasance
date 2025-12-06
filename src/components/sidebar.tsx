
// src/components/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookOpen,
  LogOut,
  Menu,
  Shield,
  UserCircle,
  UserX,
  Users,
  Landmark,
  Sparkles,
  Bug,
  Bot,
  Info,
  DollarSign,
  Github,
  CalendarHeart,
  Warehouse,
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
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { ScrollArea } from './ui/scroll-area';
import { ThemeSwitcher } from './theme-switcher';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { LanguageToggle } from './language-toggle';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from './language-provider';

const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com';

const adminLink = { href: '/admin', label: 'navAdmin', icon: Shield };

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
  const { t } = useTranslation();
  const { direction } = useLanguage();
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
        direction === 'rtl' && 'flex-row-reverse'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{t(label)}</span>
    </Link>
  );
}

function UserNav() {
  const { user } = useUser();
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const isFounder = user?.email === FOUNDER_EMAIL;

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <Link href="/login" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", direction === 'rtl' && 'flex-row-reverse')}>
        <UserCircle className="h-5 w-5" />
        <span>{t('navLogin')}</span>
      </Link>
    );
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn("flex items-center justify-start gap-3 w-full h-auto px-3 py-2", direction === 'rtl' && 'flex-row-reverse')}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sidebar-foreground">{user.displayName || t('navMyProfile')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side={direction === 'rtl' ? 'left' : 'right'} align="start" forceMount>
          <DropdownMenuItem asChild>
            <Link href="/profile" className={cn("flex items-center w-full", direction === 'rtl' && 'flex-row-reverse justify-end')}>
              <UserCircle className={cn("mr-2 h-4 w-4", direction === 'rtl' && 'ml-2 mr-0')} />
              <span>{t('navMyProfile')}</span>
            </Link>
          </DropdownMenuItem>
          {isFounder && (
              <DropdownMenuItem asChild>
                  <Link href="/admin" className={cn("flex items-center w-full", direction === 'rtl' && 'flex-row-reverse justify-end')}>
                      <Shield className={cn("mr-2 h-4 w-4", direction === 'rtl' && 'ml-2 mr-0')} />
                      <span>{t('navAdmin')}</span>
                  </Link>
              </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <ThemeSwitcher />
          </div>
          <div className="px-2 py-1.5">
            <LanguageToggle />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className={cn(direction === 'rtl' && 'flex-row-reverse justify-between')}>
            <LogOut className={cn("mr-2 h-4 w-4", direction === 'rtl' && 'ml-2 mr-0')} />
            <span>{t('navSignOut')}</span>
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem 
                className={cn("text-destructive focus:bg-destructive focus:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed", direction === 'rtl' && 'flex-row-reverse justify-between')}
                onSelect={(e) => isFounder && e.preventDefault()}
                disabled={isFounder}
            >
              <UserX className={cn("mr-2 h-4 w-4", direction === 'rtl' && 'ml-2 mr-0')} />
              <span>{t('navExitCommunity')}</span>
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
    const { t } = useTranslation();
    const { direction } = useLanguage();
    const isFounder = user?.email === FOUNDER_EMAIL;

    const navGroups = [
        {
            title: t('navFederation'),
            links: [
                { href: '/', label: 'navCommunity', icon: Users },
                { href: '/museum', label: 'navMuseum', icon: Landmark },
                { href: '/events', label: 'navEvents', icon: CalendarHeart },
            ]
        },
        {
            title: t('navCreation'),
            links: [
                { href: '/svg3d', label: 'navAIWorkshop', icon: Sparkles },
                { href: '/story', label: 'navNuncyLingua', icon: BookOpen },
                { href: '/fabrication', label: 'navFabrication', icon: Warehouse },
            ]
        },
        {
            title: t('navGovernance'),
            links: [
                { href: '/treasury', label: 'navTreasury', icon: Banknote },
                { href: '/roadmap', label: 'navRoadmap', icon: KanbanIcon },
                { href: '/bugs', label: 'navBugTracker', icon: Bug },
                { href: '/ambasedor', label: 'navAmbasedor', icon: Bot },
            ]
        },
        {
            title: t('navSystem'),
            links: [
                { href: '/home', label: 'navWiki', icon: Info },
                { href: '/pricing', label: 'navPricing', icon: DollarSign },
            ]
        }
    ];

    return (
        <aside className={cn(
            "fixed inset-y-0 z-50 hidden w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground sm:flex",
            direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'
        )}>
             <div className="flex h-16 items-center border-b px-6 border-sidebar-accent">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-8 w-8 text-primary" />
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{t('pleasance')}</span>
                        <Badge variant="secondary" className="text-xs">
                            BETA
                        </Badge>
                    </div>
                </Link>
            </div>
            <ScrollArea className="flex-1">
                <nav className="grid items-start p-4 text-sm font-medium">
                    {navGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="mb-2">
                            <h3 className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", direction === 'rtl' && 'text-right')}>{group.title}</h3>
                            {group.links.map((link) => (
                                <NavLink
                                    key={link.href}
                                    {...link}
                                    isActive={pathname === link.href}
                                />
                            ))}
                        </div>
                    ))}
                        {isFounder && (
                            <div className="mb-2">
                            <Separator className="my-2 bg-sidebar-accent" />
                            <h3 className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", direction === 'rtl' && 'text-right')}>{t('navFounder')}</h3>
                            <NavLink
                                key={adminLink.href}
                                {...adminLink}
                                isActive={pathname === adminLink.href}
                            />
                        </div>
                    )}
                </nav>
            </ScrollArea>
            <div className="mt-auto p-4 border-t space-y-2 border-sidebar-accent">
                <div className="mb-2">
                <h3 className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", direction === 'rtl' && 'text-right')}>Open Source</h3>
                <a
                    href="https://github.com/no-am-man/Pleasance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    direction === 'rtl' && 'flex-row-reverse'
                    )}
                >
                    <Github className="h-5 w-5" />
                    <span>{t('navGithub')}</span>
                </a>
                <a
                    href="https://firebase.google.com/docs/studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    direction === 'rtl' && 'flex-row-reverse'
                    )}
                >
                    <Sparkles className="h-5 w-5" />
                    <span>{t('navPoweredBy')}</span>
                </a>
                </div>
                <Separator className="bg-sidebar-accent" />
                <UserNav />
            </div>
        </aside>
    )
}
