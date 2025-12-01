'use client';

import { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Only run this on the client
    const checkScrollability = () => {
      // Show indicator if the content is taller than the window
      const isScrollable = document.body.scrollHeight > window.innerHeight;
      setIsVisible(isScrollable);
    };

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
      }
    };
    
    // A slight delay to allow the page to fully render before checking
    const timer = setTimeout(() => {
      checkScrollability();
      window.addEventListener('resize', checkScrollability);
      window.addEventListener('scroll', handleScroll);
    }, 500);


    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScrollability);
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible || hasScrolled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 transition-opacity duration-300 animate-in fade-in">
        <span className="text-xs text-muted-foreground">Scroll</span>
        <div className="rounded-full bg-primary/20 p-2 text-primary animate-bounce-slow">
            <ArrowDown className="h-6 w-6" />
        </div>
    </div>
  );
}
