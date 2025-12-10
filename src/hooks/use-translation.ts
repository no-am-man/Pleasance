
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/language-provider';

export function useTranslation() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [language]);

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    if (!translations) return key;

    let translation = translations[key] || key;

    if (options) {
        Object.keys(options).forEach(optionKey => {
            translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
        });
    }

    return translation;
  };
  
   const tData = (key: string): any => {
    if (!translations) return null;
    return translations[key] || null;
  }

  return { t, tData, isLoading };
}
