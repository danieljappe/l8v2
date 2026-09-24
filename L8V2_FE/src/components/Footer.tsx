import React from 'react';
import { Link } from 'react-router-dom';
import { openConsentSettings } from '../consent/consentStore';

const Footer: React.FC = () => (
  <footer className="relative z-10 border-t border-white/10 bg-l8-dark/60 backdrop-blur-sm">
    <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white/70 sm:flex-row">
      <p>© {new Date().getFullYear()} L8 Events</p>
      <nav aria-label="Juridisk" className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/privatlivspolitik" className="underline-offset-4 hover:text-white hover:underline">
          Privatlivspolitik
        </Link>
        {/* A button, not a link: it opens the banner rather than navigating. */}
        <button
          type="button"
          onClick={openConsentSettings}
          className="underline-offset-4 hover:text-white hover:underline"
        >
          Cookie-indstillinger
        </button>
      </nav>
    </div>
  </footer>
);

export default Footer;
