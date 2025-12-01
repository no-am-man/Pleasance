
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
                  asChild
                  isActive={isActive('/')}
                  icon={<Home />}
                  tooltip="Home"
                >
                  <a>
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/community" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/community')}
                  icon={<Users />}
                  tooltip="Community"
                >
                  <a>
                    <Users className="h-4 w-4" />
                    <span>Community</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/story" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/story')}
                  icon={<BookOpen />}
                  tooltip="Burlington Edge"
                >
                  <a>
                    <BookOpen className="h-4 w-4" />
                    <span>Burlington Edge</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/fabrication" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/fabrication')}
                  icon={<Warehouse />}
                  tooltip="Fabrication"
                >
                  <a>
                    <Warehouse className="h-4 w-4" />
                    <span>Fabrication</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/treasury" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/treasury')}
                  icon={<Banknote />}
                  tooltip="Treasury"
                >
                  <a>
                    <Banknote className="h-4 w-4" />
                    <span>Treasury</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/wiki" passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/wiki')}
                  icon={<Info />}
                  tooltip="Wiki"
                >
                  <a>
                    <Info className="h-4 w-4" />
                    <span>Wiki</span>
                  </a>
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
                  asChild
                  isActive={isActive('/profile')}
                  icon={<UserCircle />}
                  tooltip="My Profile"
                >
                  <a>
                    <UserCircle className="h-4 w-4" />
                    <span>My Profile</span>
                  </a>
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

    