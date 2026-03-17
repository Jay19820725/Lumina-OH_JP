import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Navigation } from './components/layout/Navigation';
import { KomorebiBackground } from './components/layout/KomorebiBackground';
import { ConnectionStatus } from './components/ui/ConnectionStatus';
import { SEOManager } from './components/SEOManager';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
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
const Ocean = lazy(() => import('./pages/Ocean').then(m => ({ default: m.Ocean })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));

type Page = 'home' | 'test' | 'report' | 'profile' | 'history' | 'admin' | 'admin-login' | 'ocean';

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
  const [pendingReport, setPendingReport] = useState<any>(null);

  // Check for completed reports that haven't been seen
  useEffect(() => {
    if (profile?.uid && currentPage !== 'report') {
      fetch(`/api/reports/${profile.uid}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
          }
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Response was not JSON");
          }
          return res.json();
        })
        .then(data => {
          // The API returns { reports: [...], hasOtherLang: boolean, otherLangCount: number }
          const reports = data.reports || [];
          if (Array.isArray(reports) && reports.length > 0) {
            const latest = reports[0];
            const lastSeenId = localStorage.getItem('lastSeenReportId');
            // If it's a completed report (has todayTheme) and we haven't seen it
            if (latest.id !== lastSeenId && latest.todayTheme) {
              setPendingReport(latest);
            }
          }
        })
        .catch(err => {
          // Only log if it's not a common "not found" or "unauthorized" error during initial load
          if (!err.message.includes('404') && !err.message.includes('401')) {
            console.error("Failed to fetch reports for return prompt:", err);
          }
        });
    }
  }, [profile?.uid, currentPage]);

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
      const validPages: Page[] = ['home', 'test', 'report', 'profile', 'history', 'admin', 'admin-login', 'ocean'];
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

  const navigate = (page: Page | string) => {
    const isSubPath = page.includes('/');
    const basePage = isSubPath ? page.split('/')[0] : page;
    
    setCurrentPage(basePage as Page);
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
      case 'ocean':
        return <Ocean />;
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
      />
      
      <SoundControl />
      <ConnectionStatus />

      {/* Return Prompt for Completed AI Analysis */}
      <AnimatePresence>
        {pendingReport && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 left-6 right-6 md:left-auto md:right-12 md:w-96 z-[60]"
          >
            <div className="bg-white/80 backdrop-blur-2xl border border-wood/20 rounded-3xl p-6 shadow-2xl shadow-wood/10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-wood/10 flex items-center justify-center text-wood">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-serif text-lg text-ink tracking-wide">{t('report_revealed_ready')}</h4>
                </div>
                <button 
                  onClick={() => {
                    localStorage.setItem('lastSeenReportId', pendingReport.id);
                    setPendingReport(null);
                  }}
                  className="p-1 hover:bg-ink/5 rounded-full transition-colors"
                >
                  <X size={18} className="text-ink-muted" />
                </button>
              </div>
              
              <p className="text-sm text-ink-muted leading-relaxed font-light">
                {t('report_return_prompt')}
              </p>
              
              <button
                onClick={() => {
                  localStorage.setItem('lastSeenReportId', pendingReport.id);
                  setPendingReport(null);
                  navigate(`report/${pendingReport.id}` as any);
                }}
                className="flex items-center justify-center gap-2 w-full h-12 bg-wood text-white rounded-2xl text-sm tracking-widest hover:bg-wood/90 transition-all active:scale-[0.98]"
              >
                {t('report_view_now')}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
