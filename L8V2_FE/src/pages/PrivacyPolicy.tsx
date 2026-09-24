import React, { useEffect, useMemo } from 'react';
import policy from '../content/privatlivspolitik.md?raw';
import { findPlaceholders, renderMarkdown } from '../content/renderMarkdown';
import CookieTable from '../consent/CookieTable';
import { useSEO } from '../hooks/useSEO';

const PrivacyPolicy: React.FC = () => {
  useSEO({
    title: 'Privatlivspolitik',
    description: 'Sådan behandler L8 Events dine personoplysninger, og hvilke cookies vi bruger.',
    url: '/privatlivspolitik',
  });

  const content = useMemo(
    () =>
      renderMarkdown(policy, {
        slots: { 'cookie-tabel': <CookieTable /> },
        highlightPlaceholders: import.meta.env.DEV,
      }),
    [],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const open = findPlaceholders(policy);
    if (open.length) console.warn('[privatlivspolitik] Unfilled placeholders:', open);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 pb-16 pt-28 text-white/85 leading-relaxed">
      <article>{content}</article>
    </div>
  );
};

export default PrivacyPolicy;
