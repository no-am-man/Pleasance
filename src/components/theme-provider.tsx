'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';

type Theme = 'theme-default' | 'theme-commune' | 'theme-founder' | 'dark';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'theme-default',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'theme-default',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const { user } = useUser();
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-default', 'theme-commune', 'theme-founder', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Fetch theme from user profile if available
  useEffect(() => {
    if (user && firestore) {
      const profileRef = doc(firestore, 'community-profiles', user.uid);
      getDoc(profileRef).then(docSnap => {
        if (docSnap.exists()) {
          const userTheme = docSnap.data().theme as Theme;
          if (userTheme) {
            setTheme(userTheme);
          }
        }
      });
    }
  }, [user]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
