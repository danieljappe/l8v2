import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { startConsentEffects, startConsentProofLogging } from './consent/consentEffects';

// Before the first render: applies a stored choice (loads GA only if
// `statistics` was granted) and clears stale analytics cookies otherwise.
startConsentEffects();
startConsentProofLogging();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // data stays fresh for 5 minutes
      gcTime:    10 * 60 * 1000, // keep unused data in cache for 10 minutes
      retry: 1,
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
