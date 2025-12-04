
'use client';

import { Check, Palette } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();

  const themes = [
    { name: 'Default', value: 'theme-default' },
    { name: 'Commune', value: 'theme-commune' },
    { name: 'Founder', value: 'theme-founder' },
    { name: 'Dark', value: 'dark' },
  ];

  const handleThemeChange = (newTheme: 'theme-default' | 'theme-commune' | 'theme-founder' | 'dark') => {
    setTheme(newTheme);
    if (user && firestore) {
      const profileRef = doc(firestore, 'community-profiles', user.uid);
      setDocumentNonBlocking(profileRef, { theme: newTheme }, { merge: true });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-0">
            <Palette className="h-5 w-5" />
            <span>{t('navTheme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(t => (
          <DropdownMenuItem key={t.value} onClick={() => handleThemeChange(t.value as any)}>
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
