
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
              <Link href="/">
                <SidebarMenuButton
                  isActive={isActive('/')}
                  icon={<Home />}
                  tooltip="Home"
                >
                  Home
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/community">
                <SidebarMenuButton
                  isActive={isActive('/community')}
                  icon={<Users />}
                  tooltip="Community"
                >
                  Community
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/story">
                <SidebarMenuButton
                  isActive={isActive('/story')}
                  icon={<BookOpen />}
                  tooltip="Burlington Edge"
                >
                  Burlington Edge
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/fabrication">
                <SidebarMenuButton
                  isActive={isActive('/fabrication')}
                  icon={<Warehouse />}
                  tooltip="Fabrication"
                >
                  Fabrication
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/treasury">
                <SidebarMenuButton
                  isActive={isActive('/treasury')}
                  icon={<Banknote />}
                  tooltip="Treasury"
                >
                  Treasury
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/wiki">
                <SidebarMenuButton
                  isActive={isActive('/wiki')}
                  icon={<Info />}
                  tooltip="Wiki"
                >
                  Wiki
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarContent className="!flex-grow-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/profile">
                <SidebarMenuButton
                  isActive={isActive('/profile')}
                  icon={<UserCircle />}
                  tooltip="My Profile"
                >
                  My Profile
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
