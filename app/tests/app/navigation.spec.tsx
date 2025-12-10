
// tests/app/navigation.spec.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { Sidebar, navGroups } from '@/components/sidebar';
import en from '@/locales/en.json';

// Mock the hooks used by the Sidebar component
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/firebase/use-user', () => ({
  useUser: () => ({ user: null, isUserLoading: false }),
}));

vi.mock('@/components/language-provider', () => ({
    useLanguage: () => ({
        language: 'en',
        direction: 'ltr',
        setLanguage: vi.fn(),
        translations: en,
        isTranslationsLoading: false,
    }),
}));

// Mock the translation hook to provide real translations
vi.mock('@/hooks/use-translation', () => ({
    useTranslation: () => ({
        t: (key: string) => (en as Record<string, string>)[key] || key,
        tData: (key: string) => (en as Record<string, any>)[key] || null,
        isLoading: false,
    }),
}));

describe('Sidebar Navigation', () => {
  test('should render all navigation links with the correct href attributes', () => {
    render(<Sidebar />);

    const allLinks: { href: string; label: string }[] = navGroups(
      (key: string) => (en as Record<string, string>)[key] || key
    ).flatMap(group => group.links);

    allLinks.forEach(link => {
      const linkElements = screen.getAllByText((en as Record<string, string>)[link.label] || link.label);
      
      const parentAnchor = linkElements[0].closest('a');
      expect(parentAnchor).not.toBeNull();
      expect(parentAnchor?.getAttribute('href')).toBe(link.href);
    });

    console.log('Verified all sidebar navigation links have correct hrefs.');
  });
});
