
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookOpen,
  Home,
  Info,
  UserCircle,
  Users,
  Warehouse,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="size-8 shrink-0" />
            <span className="text-lg font-semibold text-primary">
              Pleasance
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/')}
                  icon={<Home />}
                  tooltip="Home"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/community" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/community')}
                  icon={<Users />}
                  tooltip="Community"
                >
                  <Users className="h-4 w-4" />
                  <span>Community</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/story" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/story')}
                  icon={<BookOpen />}
                  tooltip="Burlington Edge"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Burlington Edge</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/fabrication" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/fabrication')}
                  icon={<Warehouse />}
                  tooltip="Fabrication"
                >
                  <Warehouse className="h-4 w-4" />
                  <span>Fabrication</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/treasury" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/treasury')}
                  icon={<Banknote />}
                  tooltip="Treasury"
                >
                  <Banknote className="h-4 w-4" />
                  <span>Treasury</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/wiki" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/wiki')}
                  icon={<Info />}
                  tooltip="Wiki"
                >
                  <Info className="h-4 w-4" />
                  <span>Wiki</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarContent className="!flex-grow-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/profile" passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive('/profile')}
                  icon={<UserCircle />}
                  tooltip="My Profile"
                >
                  <UserCircle className="h-4 w-4" />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between border-b bg-background/50 p-2 backdrop-blur-sm md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-8" />
            <span className="text-lg font-semibold text-primary">Pleasance</span>
          </Link>
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </>
  );
}
