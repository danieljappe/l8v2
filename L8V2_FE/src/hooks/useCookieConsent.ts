import { useState, useEffect, useCallback } from 'react';

export type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => {
    if (typeof window === 'undefined') return { necessary: true, analytics: false, marketing: false };
    
    const saved = localStorage.getItem('cookieConsent');
    return saved ? JSON.parse(saved) : { necessary: true, analytics: false, marketing: false };
  });

  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cookieConsent');
    if (saved) {
      setHasConsented(true);
      setPreferences(JSON.parse(saved));
    }

    // Listen for consent updates
    const handleConsentUpdate = (event: CustomEvent<ConsentPreferences>) => {
      setPreferences(event.detail);
      setHasConsented(true);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, []);

  const hasAnalyticsConsent = useCallback(() => {
    return preferences.analytics;
  }, [preferences.analytics]);

  const hasMarketingConsent = useCallback(() => {
    return preferences.marketing;
  }, [preferences.marketing]);

  const hasAnyConsent = useCallback(() => {
    return hasConsented;
  }, [hasConsented]);

  return {
    preferences,
    hasAnalyticsConsent,
    hasMarketingConsent,
    hasAnyConsent,
    hasConsented
  };
};

