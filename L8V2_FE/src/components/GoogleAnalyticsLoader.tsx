import { useEffect } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';

// Replace with your actual Google Analytics ID
const GA_MEASUREMENT_ID = 'G-7PW96SVNBD';

const GoogleAnalyticsLoader: React.FC = () => {
  const { hasAnalyticsConsent } = useCookieConsent();

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;

    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    return () => {
      // Cleanup on unmount if consent is withdrawn
      const gtagScript = document.querySelector(`script[src*="googletagmanager"]`);
      if (gtagScript) {
        gtagScript.remove();
      }
    };
  }, [hasAnalyticsConsent]);

  return null;
};

export default GoogleAnalyticsLoader;

