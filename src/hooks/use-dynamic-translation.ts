
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/language-provider';
import { translateTextAction } from '@/app/actions';

const cache = new Map<string, string>();

export function useDynamicTranslation(originalText: string | undefined | null) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!originalText) {
      if (translatedText !== '') setTranslatedText('');
      return;
    }

    let isCancelled = false;

    const translate = async () => {
      if (language === 'en') {
        if (translatedText !== originalText) setTranslatedText(originalText);
        return;
      }

      const cacheKey = `${language}:${originalText}`;
      if (cache.has(cacheKey)) {
        const cachedValue = cache.get(cacheKey)!;
        if (translatedText !== cachedValue) setTranslatedText(cachedValue);
        return;
      }
      
      if (!isCancelled) setIsLoading(true);
      
      try {
        const result = await translateTextAction({
          text: originalText,
          targetLanguage: language === 'he' ? 'Hebrew' : 'English',
        });

        if (!isCancelled) {
          const translation = result.translation || originalText;
          cache.set(cacheKey, translation);
          if (translatedText !== translation) setTranslatedText(translation);
        }
      } catch (error) {
        console.error("Translation failed:", error);
        if (!isCancelled && translatedText !== originalText) {
          setTranslatedText(originalText);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    translate();

    return () => {
      isCancelled = true;
    };
  }, [originalText, language]);

  return { translatedText, isLoading };
}
