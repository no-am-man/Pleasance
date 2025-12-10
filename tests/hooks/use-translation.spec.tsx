// tests/hooks/use-translation.spec.tsx
import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageProvider } from '@/components/language-provider';
import React from 'react';

// Mock the language provider context
const mockUseLanguage = vi.fn();

vi.mock('@/components/language-provider', async () => {
  const original = await vi.importActual('@/components/language-provider');
  return {
    ...original,
    useLanguage: () => mockUseLanguage(),
  };
});

describe('useTranslation Hook', () => {

  test('should return the correct English translation for a simple key', () => {
    mockUseLanguage.mockReturnValue({
      translations: { 'pleasance': 'Pleasance' },
      isTranslationsLoading: false,
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('pleasance')).toBe('Pleasance');
  });

  test('should return the correct Hebrew translation for a simple key', () => {
    mockUseLanguage.mockReturnValue({
      translations: { 'pleasance': 'נעימות' },
      isTranslationsLoading: false,
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('pleasance')).toBe('נעימות');
  });

  test('should return the key when translation is not found', () => {
     mockUseLanguage.mockReturnValue({
      translations: { 'pleasance': 'Pleasance' },
      isTranslationsLoading: false,
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('non_existent_key')).toBe('non_existent_key');
  });

  test('should return the key when translations are loading', () => {
    mockUseLanguage.mockReturnValue({
      translations: null,
      isTranslationsLoading: true,
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('pleasance')).toBe('pleasance');
  });

  test('should handle interpolation correctly', () => {
    const mockTranslations = {
      "community_page_remove_member_dialog_title": "Remove {name}?",
    };
    mockUseLanguage.mockReturnValue({
      translations: mockTranslations,
      isTranslationsLoading: false,
    });

    const { result } = renderHook(() => useTranslation());
    const translatedString = result.current.t('community_page_remove_member_dialog_title', { name: 'Alice' });
    
    expect(translatedString).toBe('Remove Alice?');
  });

  test('should return nested data using tData', () => {
    const mockTranslations = {
        "pricing_tiers": [
            { "name": "Congregation" },
            { "name": "Clergy" }
        ]
    };
    mockUseLanguage.mockReturnValue({
      translations: mockTranslations,
      isTranslationsLoading: false,
    });

    const { result } = renderHook(() => useTranslation());
    const tiers = result.current.tData('pricing_tiers');
    
    expect(Array.isArray(tiers)).toBe(true);
    expect(tiers.length).toBe(2);
    expect(tiers[0].name).toBe('Congregation');
  });
});
