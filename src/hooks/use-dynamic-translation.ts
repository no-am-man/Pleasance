
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
      setTranslatedText('');
      return;
    }

    // Immediately set text based on language, using original for 'en'
    // or falling back to original if no translation is cached yet.
    if (language === 'en') {
      setTranslatedText(originalText);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${language}:${originalText}`;

    if (cache.has(cacheKey)) {
      setTranslatedText(cache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // If not English and not in cache, start fetching.
    // Show original text while loading.
    setTranslatedText(originalText);
    setIsLoading(true);

    let isCancelled = false;

    const translate = async () => {
      try {
        const result = await translateTextAction({
          text: originalText,
          targetLanguage: language === 'he' ? 'Hebrew' : 'English',
        });

        if (!isCancelled) {
          const translation = result.translation || originalText;
          cache.set(cacheKey, translation);
          setTranslatedText(translation);
        }
      } catch (error) {
        console.error("Translation failed:", error);
        if (!isCancelled) {
          // On error, fall back to original text
          setTranslatedText(originalText);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    translate();

    // Cleanup function to prevent state updates on unmounted components
    return () => {
      isCancelled = true;
    };
  }, [originalText, language]); // Rerun effect if originalText or language changes

  return { translatedText, isLoading };
}
