import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import { AuthProvider } from './store/AuthContext';
import { TestProvider } from './store/TestContext';
import { SoundscapeProvider } from './store/SoundscapeContext';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestProvider>
          <SoundscapeProvider>
            <App />
          </SoundscapeProvider>
        </TestProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
