import { useEffect, useState } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// Additional hook for tablet detection
export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(() => window.innerWidth > 640 && window.innerWidth <= 1024);

  useEffect(() => {
    function handleResize() {
      setIsTablet(window.innerWidth > 640 && window.innerWidth <= 1024);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isTablet;
}

// Combined mobile/tablet detection
export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => window.innerWidth <= 1024);

  useEffect(() => {
    function handleResize() {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobileOrTablet;
}