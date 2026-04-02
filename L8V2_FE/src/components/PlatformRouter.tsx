import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPlatformFromPath, shouldShowPlatformChoice } from '../utils/subdomainUtils';
import PlatformChoice from './PlatformChoice';

interface PlatformRouterProps {
  children: React.ReactNode;
}

const PlatformRouter: React.FC<PlatformRouterProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPlatform = () => {
      const showChoice = shouldShowPlatformChoice();
      
      // If we should show platform choice, don't redirect
      if (showChoice) {
        setIsChecking(false);
        return;
      }
      
      setIsChecking(false);
    };

    checkPlatform();
  }, [location.pathname, navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-l8-dark via-l8-blue-dark to-l8-blue">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-l8-blue to-l8-blue-light rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full" />
          </div>
          <p className="text-white/60">Loading platform...</p>
        </div>
      </div>
    );
  }

  // Show platform choice if needed
  if (shouldShowPlatformChoice()) {
    return <PlatformChoice />;
  }

  return <>{children}</>;
};

export default PlatformRouter;
