'use client';

import { Check, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, getFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from './language-provider';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();
  const { direction } = useLanguage();

  const themes = [
    { name: 'Light', value: 'light' },
    { name: 'Dark', value: 'dark' },
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (user) {
      const { firestore } = getFirebase();
      const profileRef = doc(firestore, 'community-profiles', user.uid);
      setDocumentNonBlocking(profileRef, { theme: newTheme }, { merge: true });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("w-full justify-start gap-3 px-0", direction === 'rtl' && 'flex-row-reverse')}>
            <Palette className="h-5 w-5" />
            <span>{t('navTheme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(t => (
          <DropdownMenuItem key={t.value} onClick={() => handleThemeChange(t.value)}>
             <div className={cn("w-4 h-4 mr-2", theme !== t.value && "opacity-0")}>
                <Check className="h-4 w-4"/>
            </div>
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
