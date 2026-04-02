import React, { useState, useEffect, useCallback } from 'react';
import { Settings, X, ChevronDown, ChevronUp } from 'lucide-react';

type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

type ConsentPreferencesProps = {
  preferences: ConsentPreferences;
  onChange: (preferences: ConsentPreferences) => void;
};

const CookiePreferences: React.FC<ConsentPreferencesProps> = ({ preferences, onChange }) => {
  const handleToggle = (category: keyof ConsentPreferences) => {
    onChange({
      ...preferences,
      [category]: !preferences[category]
    });
  };

  return (
    <div className="space-y-4 mt-4 text-sm">
      {/* Necessary Cookies - Always On */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">Nødvendige cookies</h4>
          <p className="text-gray-300 text-xs">Disse cookies er påkrævet for, at hjemmesiden fungerer.</p>
        </div>
        <div className="ml-4">
          <button
            disabled
            className="bg-gray-600 text-white px-3 py-1 rounded text-xs cursor-not-allowed"
          >
            Påkrævet
          </button>
        </div>
      </div>

      {/* Analytics Cookies - Optional */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">Statistik cookies</h4>
          <p className="text-gray-300 text-xs">Hjælper os med at forstå, hvordan besøgende bruger hjemmesiden.</p>
        </div>
        <div className="ml-4">
          <button
            onClick={() => handleToggle('analytics')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              preferences.analytics
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {preferences.analytics ? 'Aktiveret' : 'Deaktiveret'}
          </button>
        </div>
      </div>

      {/* Marketing Cookies - Optional */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">Marketing cookies</h4>
          <p className="text-gray-300 text-xs">Anvendes til at levere relevante annoncer og kampagner.</p>
        </div>
        <div className="ml-4">
          <button
            onClick={() => handleToggle('marketing')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              preferences.marketing
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {preferences.marketing ? 'Aktiveret' : 'Deaktiveret'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  const openBanner = useCallback(() => {
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      const consentData = JSON.parse(savedConsent);
      setPreferences(consentData);
    }
    setShowBanner(true);
  }, []);

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem('cookieConsent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      const consentData = JSON.parse(savedConsent);
      setPreferences(consentData);
    }
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      openBanner();
    };

    window.addEventListener('openCookieSettings', handleOpenSettings);
    return () => {
      window.removeEventListener('openCookieSettings', handleOpenSettings);
    };
  }, [openBanner]);

  const savePreferences = (consentPrefs: ConsentPreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(consentPrefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setPreferences(consentPrefs);
    setShowBanner(false);
    
    // Trigger custom event for analytics tracking
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consentPrefs }));
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    savePreferences(allRejected);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="max-w-4xl w-full bg-gradient-to-br from-l8-dark to-l8-blue-dark rounded-2xl shadow-2xl border border-white/10 backdrop-blur-lg pointer-events-auto animate-slide-up">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Luk"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-start space-x-3">
            <Settings className="text-l8-blue flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Cookie indstillinger
              </h3>
              <p className="text-gray-300 text-sm md:text-base">
                Vi bruger cookies til at forbedre din oplevelse, analysere trafik og tilpasse indhold. Du kan vælge, hvilke cookies der skal accepteres.
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        {showPreferences && (
          <div className="px-6 pb-4">
            <CookiePreferences preferences={preferences} onChange={setPreferences} />
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              <span>Detaljerede indstillinger</span>
              {showPreferences ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {showPreferences && (
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-2.5 bg-l8-blue hover:bg-l8-blue/90 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Gem indstillinger
                </button>
              )}
              
              <button
                onClick={handleRejectAll}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Nægt alle
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-l8-blue to-l8-purple hover:from-l8-blue/90 hover:to-l8-purple/90 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap font-semibold"
              >
                Accepter alle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
export type { ConsentPreferences };

