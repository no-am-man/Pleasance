
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

    if (language === 'en') {
      setTranslatedText(originalText);
      return;
    }
    
    // If we are not in english, we should start with the original text until translation is ready
    setTranslatedText(originalText);

    const cacheKey = `${language}:${originalText}`;
    if (cache.has(cacheKey)) {
      setTranslatedText(cache.get(cacheKey)!);
      return;
    }

    let isCancelled = false;
    
    const translate = async () => {
      setIsLoading(true);
      try {
        const result = await translateTextAction({
          text: originalText,
          targetLanguage: language === 'he' ? 'Hebrew' : 'English',
        });
        
        if (!isCancelled) {
          if (result.translation) {
            cache.set(cacheKey, result.translation);
            setTranslatedText(result.translation);
          } else {
            setTranslatedText(originalText);
          }
        }
      } catch (error) {
        console.error("Translation failed:", error);
        if (!isCancelled) {
          setTranslatedText(originalText);
        }
      } finally {
        if (!isCancelled) {
            setIsLoading(false);
        }
      }
    };

    translate();

    return () => {
      isCancelled = true;
    };
  }, [originalText, language]);

  return { translatedText, isLoading };
}
