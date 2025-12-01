// src/hooks/use-is-mobile.ts
'use client';

import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This function will only run on the client side
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Run the check once on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [breakpoint]); // Re-run effect if breakpoint changes

  return isMobile;
};

export default useIsMobile;
