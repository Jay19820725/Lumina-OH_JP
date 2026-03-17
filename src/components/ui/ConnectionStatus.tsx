import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type ConnectionState = 'connected' | 'offline' | 'error';

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<ConnectionState>('connected');
  const [isAuthOk, setIsAuthOk] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    // Monitor Auth Status
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setIsAuthOk(!!user);
      });
    } else {
      setStatus('error');
    }

    // Monitor Browser Online Status
    const handleOnline = () => setStatus('connected');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!window.navigator.onLine) {
      setStatus('offline');
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return isAuthOk ? 'bg-emerald-400' : 'bg-amber-400';
      case 'offline': return 'bg-amber-500';
      case 'error': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connected': return isAuthOk ? '能量連結：穩定' : '能量連結：訪客模式';
      case 'offline': return '能量連結：中斷 (離線)';
      case 'error': return '能量連結：異常';
      default: return '能量連結：偵測中';
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 cursor-help"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
    >
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-ink/5 shadow-sm"
          >
            <span className="text-[10px] tracking-[0.2em] text-ink-muted whitespace-nowrap">
              {getStatusLabel()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center">
        {/* Breathing Outer Ring */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute w-4 h-4 rounded-full ${getStatusColor()}`}
        />
        
        {/* Solid Inner Dot */}
        <div className={`relative w-2 h-2 rounded-full ${getStatusColor()} shadow-sm`} />
      </div>
    </div>
  );
};
