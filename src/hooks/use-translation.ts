
'use client';

import { useLanguage } from '@/components/language-provider';

export function useTranslation() {
  const { translations, isTranslationsLoading } = useLanguage();

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    if (isTranslationsLoading || !translations) {
      // During load, or if translations are missing, return the key or a loading indicator
      return key;
    }

    let translation = translations[key] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{${optionKey}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }

    return translation;
  };

  const tData = (key: string): any => {
    if (isTranslationsLoading || !translations) return null;
    return translations[key] || null;
  };

  return { t, tData, isLoading: isTranslationsLoading };
}
