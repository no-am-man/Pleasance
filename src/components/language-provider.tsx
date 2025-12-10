
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'he';
type Direction = 'ltr' | 'rtl';

type LanguageProviderProps = {
  children: ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
};

type LanguageProviderState = {
  language: Language;
  direction: Direction;
  setLanguage: (language: Language) => void;
  translations: any;
  isTranslationsLoading: boolean;
};

const initialState: LanguageProviderState = {
  language: 'he',
  direction: 'rtl',
  setLanguage: () => null,
  translations: null,
  isTranslationsLoading: true,
};

const LanguageProviderContext = createContext<LanguageProviderState>(initialState);

export function LanguageProvider({
  children,
  defaultLanguage = 'he',
  storageKey = 'app-language',
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(
    () => (typeof window !== 'undefined' ? (localStorage.getItem(storageKey) as Language) : defaultLanguage) || defaultLanguage
  );
  const [translations, setTranslations] = useState<any>(null);
  const [isTranslationsLoading, setIsTranslationsLoading] = useState(true);

  const direction = language === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = window.document.documentElement;
    root.lang = language;
    root.dir = direction;
    localStorage.setItem(storageKey, language);

    const fetchTranslations = async () => {
      setIsTranslationsLoading(true);
      try {
        const langModule = await import(`@/locales/${language}.json`);
        setTranslations(langModule.default);
      } catch (error) {
        console.error(`Could not load translation file for language: ${language}`, error);
        if (language !== 'en') {
          const fallbackModule = await import(`@/locales/en.json`);
          setTranslations(fallbackModule.default);
        }
      } finally {
        setIsTranslationsLoading(false);
      }
    };

    fetchTranslations();

  }, [language, direction, storageKey]);


  const value = {
    language,
    direction,
    setLanguage: (lang: Language) => {
      setLanguage(lang);
    },
    translations,
    isTranslationsLoading,
  };

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
