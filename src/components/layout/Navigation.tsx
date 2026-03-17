import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, History, Home, ShieldAlert, Waves, Bell } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../store/NotificationContext';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  
  const navItems = [
    { path: 'home', label: t('nav_home'), icon: Home },
    { path: 'test', label: t('nav_test'), icon: Sparkles },
    { path: 'ocean', label: t('nav_ocean'), icon: Waves },
    { path: 'history', label: t('nav_history'), icon: History },
    { path: 'profile', label: t('nav_profile'), icon: User },
  ];

  if (isAdmin) {
    navItems.push({ path: 'admin', label: t('admin_panel'), icon: ShieldAlert });
  }

  return (
    <nav className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] md:w-auto">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/60 backdrop-blur-3xl border border-white/30 px-3 md:px-10 py-2 md:py-4 flex items-center justify-between md:justify-center gap-1 md:gap-10 rounded-full shadow-[0_20px_80px_-20px_rgba(0,0,0,0.1)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`relative flex items-center gap-2 transition-all duration-500 px-3 md:px-5 py-2.5 rounded-full ${
                isActive ? 'text-ink bg-ink/5' : 'text-ink/30 hover:text-ink/60'
              }`}
            >
              <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 1.8 : 1.2} />
              
              {item.path === 'profile' && unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-water rounded-full shadow-[0_0_8px_rgba(139,168,137,0.6)]" />
              )}
              
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, x: -10 }}
                    animate={{ width: 'auto', opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[11px] whitespace-nowrap tracking-[0.1em] font-sans font-medium overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-ink rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </nav>
  );
};
