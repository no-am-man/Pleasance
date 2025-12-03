
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookOpen,
  ChevronDown,
  Home,
  Info,
  LogOut,
  Menu,
  Shield,
  UserCircle,
  Users,
  Warehouse,
  Beaker,
  Bug,
  UserX,
  Bot,
  DollarSign,
  Landmark,
  GalleryHorizontal,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase/use-user';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useIsMobile from '@/hooks/use-is-mobile';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com'; // Founder email check

export const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/museum', label: 'Museum', icon: Landmark },
  { href: '/svg3d', label: 'Lab', icon: Beaker },
  { href: '/conductor', label: 'Conductor', icon: Bot },
  { href: '/story', label: 'Nuncy Lingua', icon: BookOpen },
  { href: '/fabrication', label: 'Fabrication', icon: Warehouse },
  { href: '/treasury', label: 'Treasury', icon: Banknote },
  { href: '/roadmap', label: 'Roadmap', icon: KanbanIcon },
  { href: '/bugs', label: 'Bug Tracker', icon: Bug },
  { href: '/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/wiki', label: 'Wiki', icon: Info },
];

const adminLink = { href: '/admin', label: 'Admin', icon: Shield };

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

function UserNav() {
  const { user } = useUser();
  const isFounder = user?.email === FOUNDER_EMAIL;

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <NavLink href="/login" label="Login" icon={UserCircle} isActive={false} />
    );
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
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


export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const isMobile = useIsMobile();
  const isFounder = user?.email === FOUNDER_EMAIL;

  const allLinks = isFounder ? [...navLinks, adminLink] : navLinks;

  const handleSignOut = async () => {
    await signOut(auth);
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">Pleasance</span>
          <Badge variant="outline" className="text-xs">
            BETA
          </Badge>
        </div>
      </Link>
      
      {isMobile ? (
        <AlertDialog>
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
                      <Badge variant="outline" className="text-xs">
                          BETA
                      </Badge>
                      </div>
                  </Link>
                  <nav className="flex flex-col gap-2">
                      {allLinks.map((link) => (
                      <NavLink
                          key={link.href}
                          {...link}
                          isActive={pathname === link.href}
                      />
                      ))}
                      <div className="border-t -mx-4 my-2"></div>
                      {user ? (
                          <>
                          <NavLink
                              href="/profile"
                              label="My Profile"
                              icon={UserCircle}
                              isActive={pathname === '/profile'}
                          />
                          <button
                              onClick={handleSignOut}
                              className={cn(
                                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                              )}
                              >
                              <LogOut className="h-5 w-5" />
                              <span>Sign Out</span>
                          </button>
                          <AlertDialogTrigger asChild>
                            <button
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-destructive',
                                    isFounder && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={isFounder}
                                >
                                <UserX className="h-5 w-5" />
                                <span>Exit Community</span>
                            </button>
                          </AlertDialogTrigger>
                          </>
                      ) : (
                          <NavLink
                              href="/login"
                              label="Login"
                              icon={UserCircle}
                              isActive={pathname === '/login'}
                          />
                      )}
                  </nav>
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
      ) : (
         <nav className="flex items-center gap-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                Menu <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {allLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                    <NavLink
                        {...link}
                        isActive={pathname.startsWith(link.href) && (link.href !== '/' || pathname === '/')}
                        isDropdown
                    />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-border mx-2"></div>
            <UserNav />
        </nav>
      )}
      
    </header>
  );
}
