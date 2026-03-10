import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { loadTranslations } from './lib/i18n';
import { AuthProvider } from './store/AuthContext';
import { TestProvider } from './store/TestContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Load translations before rendering
loadTranslations();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestProvider>
          <App />
        </TestProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
