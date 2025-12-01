
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
              <Link href="/" asChild>
                <SidebarMenuButton
                  isActive={isActive('/')}
                  icon={<Home />}
                  tooltip="Home"
                >
                  <span>Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/community" asChild>
                <SidebarMenuButton
                  isActive={isActive('/community')}
                  icon={<Users />}
                  tooltip="Community"
                >
                  <span>Community</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/story" asChild>
                <SidebarMenuButton
                  isActive={isActive('/story')}
                  icon={<BookOpen />}
                  tooltip="Burlington Edge"
                >
                  <span>Burlington Edge</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/fabrication" asChild>
                <SidebarMenuButton
                  isActive={isActive('/fabrication')}
                  icon={<Warehouse />}
                  tooltip="Fabrication"
                >
                  <span>Fabrication</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/treasury" asChild>
                <SidebarMenuButton
                  isActive={isActive('/treasury')}
                  icon={<Banknote />}
                  tooltip="Treasury"
                >
                  <span>Treasury</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/wiki" asChild>
                <SidebarMenuButton
                  isActive={isActive('/wiki')}
                  icon={<Info />}
                  tooltip="Wiki"
                >
                  <span>Wiki</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarContent className="!flex-grow-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/profile" asChild>
                <SidebarMenuButton
                  isActive={isActive('/profile')}
                  icon={<UserCircle />}
                  tooltip="My Profile"
                >
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
