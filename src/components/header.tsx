
// src/components/header.tsx
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
import { ScrollArea } from './ui/scroll-area';
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


export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const isFounder = user?.email === FOUNDER_EMAIL;

  const handleSignOut = async () => {
    await signOut(auth);
  };

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
              { href: '/conductor', label: 'navAmbasedor', icon: Bot },
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
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">{t('pleasance')}</span>
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
            <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="bg-sidebar text-sidebar-foreground p-0 flex flex-col">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Logo className="h-8 w-8 text-primary" />
                    </Link>
                </div>
                <ScrollArea className="flex-1">
                    <nav className="grid items-start p-4 text-sm font-medium">
                        {navGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="mb-4">
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
                             <div className="mb-4">
                                <h3 className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", direction === 'rtl' && 'text-right')}>{t('navFounder')}</h3>
                                <NavLink
                                    key={adminLink.href}
                                    {...adminLink}
                                    isActive={pathname === adminLink.href}
                                />
                            </div>
                        )}
                         <div className="mb-2">
                            <Separator className="my-2 bg-white/20" />
                            <h3 className={cn("px-3 py-2 text-xs font-semibold uppercase text-white/70 tracking-wider", direction === 'rtl' && 'text-right')}>Open Source</h3>
                            <a
                            href="https://github.com/no-am-man/Pleasance"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:bg-white/10',
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
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:bg-white/10',
                                direction === 'rtl' && 'flex-row-reverse'
                            )}
                            >
                            <Sparkles className="h-5 w-5" />
                            <span>{t('navPoweredBy')}</span>
                            </a>
                        </div>
                    </nav>
                </ScrollArea>
                 <div className="mt-auto p-4 border-t">
                    {user ? (
                        <div className="space-y-2">
                            <Link href="/profile" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", direction === 'rtl' && 'flex-row-reverse')}>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{user.displayName}</span>
                            </Link>
                             <div className="px-3">
                                <ThemeSwitcher />
                             </div>
                             <div className="px-3">
                                <LanguageToggle />
                            </div>
                            <Button variant="ghost" onClick={handleSignOut} className={cn("w-full justify-start gap-3 px-3", direction === 'rtl' && 'flex-row-reverse')}>
                                <LogOut className="h-5 w-5" /> {t('navSignOut')}
                            </Button>
                             <AlertDialogTrigger asChild>
                                <Button variant="ghost" className={cn("w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive", direction === 'rtl' && 'flex-row-reverse')} disabled={isFounder}>
                                    <UserX className="h-5 w-5" /> {t('navExitCommunity')}
                                </Button>
                            </AlertDialogTrigger>
                        </div>
                    ) : (
                        <NavLink href="/login" label="navLogin" icon={UserCircle} isActive={false} />
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
