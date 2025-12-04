
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/language-provider';

export function useTranslation() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<any>(null);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const langModule = await import(`@/locales/${language}.json`);
        setTranslations(langModule.default);
      } catch (error) {
        console.error(`Could not load translation file for language: ${language}`, error);
        // Fallback to English if the desired language file fails
        if (language !== 'en') {
          const fallbackModule = await import(`@/locales/en.json`);
          setTranslations(fallbackModule.default);
        }
      }
    };

    fetchTranslations();
  }, [language]);

  const t = (key: string): string => {
    if (!translations) return key;

    // Simple key lookup. For nested keys, you might expand this.
    // e.g., key.split('.').reduce((obj, k) => obj?.[k], translations)
    return translations[key] || key;
  };
  
   const tData = (key: string): any => {
    if (!translations) return null;
    return translations[key] || null;
  }

  return { t, tData, isLoading: !translations };
}
