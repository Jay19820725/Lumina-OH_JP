import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Navigation } from './components/layout/Navigation';
import { KomorebiBackground } from './components/layout/KomorebiBackground';
import { ConnectionStatus } from './components/ui/ConnectionStatus';
import { SEOManager } from './components/SEOManager';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { SoundscapeProvider } from './store/SoundscapeContext';
import { SoundControl } from './components/layout/SoundControl';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const EnergyTest = lazy(() => import('./pages/EnergyTest').then(m => ({ default: m.EnergyTest })));
const EnergyReport = lazy(() => import('./pages/EnergyReport').then(m => ({ default: m.EnergyReport })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const EnergyTimeline = lazy(() => import('./pages/EnergyTimeline').then(m => ({ default: m.EnergyTimeline })));
const Manifestations = lazy(() => import('./pages/Manifestations').then(m => ({ default: m.Manifestations })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));

type Page = 'home' | 'test' | 'report' | 'profile' | 'history' | 'admin' | 'admin-login';

// Minimalist Sanctuary Loader
const SanctuaryLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-bg-washi z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1, 0.9] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="w-12 h-12 rounded-full bg-wood/10 blur-xl"
    />
  </div>
);

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const { profile } = useAuth();
  const { t } = useLanguage();

  // Simple URL-based routing
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      
      // Handle /report/:id
      if (path.startsWith('/report/')) {
        setCurrentPage('report');
        return;
      }

      const cleanPath = path.replace('/', '') || 'home';
      const validPages: Page[] = ['home', 'test', 'report', 'profile', 'history', 'admin', 'admin-login'];
      if (validPages.includes(cleanPath as Page)) {
        setCurrentPage(cleanPath as Page);
      } else {
        setCurrentPage('home');
      }
    };

    // Set initial page
    handleLocationChange();

    // Listen for back/forward buttons
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    const path = page === 'home' ? '/' : `/${page}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onStartTest={() => navigate('test')} />;
      case 'test':
        return <EnergyTest onComplete={() => navigate('report')} />;
      case 'report':
        return <EnergyReport onReset={() => navigate('home')} />;
      case 'profile':
        return <UserProfile onNavigate={(page) => navigate(page as Page)} />;
      case 'history':
        return <EnergyTimeline onNavigate={(page) => navigate(page as Page)} />;
      case 'admin':
        return <AdminDashboard />;
      case 'admin-login':
        return <AdminLogin onSuccess={() => navigate('home')} />;
      default:
        return <Home onStartTest={() => navigate('test')} />;
    }
  };

  return (
    <div className="relative min-h-screen selection:bg-wood/10 overflow-x-hidden">
      <SEOManager />
      <KomorebiBackground />
      
      <Suspense fallback={<SanctuaryLoader />}>
        <AnimatePresence mode="wait">
          <motion.main
            key={currentPage}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderPage()}
          </motion.main>
        </AnimatePresence>
      </Suspense>

      <Navigation 
        currentPath={currentPage} 
        onNavigate={(path) => navigate(path as Page)} 
        profile={profile}
      />
      
      <SoundControl />
      <ConnectionStatus />
      
      {/* Subtle noise texture for high-end feel */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] -z-20" />
    </div>
  );
}

export default function App() {
  return (
    <SoundscapeProvider>
      <AppContent />
    </SoundscapeProvider>
  );
}
