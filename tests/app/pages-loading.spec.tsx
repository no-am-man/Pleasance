// tests/app/pages-loading.spec.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// Mock necessary hooks and modules
vi.mock('@/firebase', async () => {
  const original = await vi.importActual('@/firebase');
  return {
    ...original,
    useUser: () => ({ user: null, isUserLoading: true }),
    useCollection: () => ({ data: null, isLoading: true, error: null }),
    useDoc: () => ({ data: null, isLoading: true, error: null }),
  };
});

vi.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    tData: (key: string) => [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-dynamic-translation', () => ({
  useDynamicTranslation: (text: string) => ({
    translatedText: text,
    isLoading: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'test-id' }),
}));

// Import page components to be tested
import CommunityPage from '@/app/page';
import MuseumPage from '@/app/museum/page';
import EventsPage from '@/app/events/page';
import Svg3dPage from '@/app/svg3d/page';
import StoryPage from '@/app/story/page';
import FabricationPage from '@/app/fabrication/page';
import TreasuryPage from '@/app/treasury/page';
import RoadmapPage from '@/app/roadmap/page';
import BugsPage from '@/app/bugs/page';
import ConductorPage from '@/app/conductor/page';
import WikiPage from '@/app/wiki/page';
import PricingPage from '@/app/pricing/page';
import AdminPage from '@/app/admin/page';
import ProfilePage from '@/app/profile/page';
import UserProfilePage from '@/app/profile/[id]/page';
import CommunityProfilePage from '@/app/community/[id]/page';
import CommunityRoadmapPage from '@/app/community/[id]/roadmap/page';
import CommunityTreasuryPage from '@/app/community/[id]/treasury/page';
import CommunityWorkshopPage from '@/app/community/[id]/workshop/page';

const pages = [
  { name: 'CommunityPage', component: CommunityPage },
  { name: 'MuseumPage', component: MuseumPage },
  { name: 'EventsPage', component: EventsPage },
  { name: 'Svg3dPage', component: Svg3dPage },
  { name: 'StoryPage', component: StoryPage },
  { name: 'FabricationPage', component: FabricationPage },
  { name: 'TreasuryPage', component: TreasuryPage },
  { name: 'RoadmapPage', component: RoadmapPage },
  { name: 'BugsPage', component: BugsPage },
  { name: 'ConductorPage', component: ConductorPage },
  { name: 'WikiPage', component: WikiPage },
  { name: 'PricingPage', component: PricingPage },
  { name: 'AdminPage', component: AdminPage },
  { name: 'ProfilePage', component: ProfilePage },
  { name: 'UserProfilePage', component: UserProfilePage },
  { name: 'CommunityProfilePage', component: CommunityProfilePage },
  { name: 'CommunityRoadmapPage', component: CommunityRoadmapPage },
  { name: 'CommunityTreasuryPage', component: CommunityTreasuryPage },
  { name: 'CommunityWorkshopPage', component: CommunityWorkshopPage },
];

describe('Page Loading States', () => {
  pages.forEach(({ name, component: PageComponent }) => {
    test(`renders ${name} in its loading state without crashing`, () => {
      expect(() => render(<PageComponent />)).not.toThrow();
      console.log(`${name} rendered successfully.`);
    });
  });
});
