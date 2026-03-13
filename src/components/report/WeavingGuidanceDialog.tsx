import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../i18n/LanguageContext';

interface WeavingGuidanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export const WeavingGuidanceDialog: React.FC<WeavingGuidanceDialogProps> = ({ isOpen, onClose, onReset }) => {
  const { t } = useLanguage();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-6 bg-ink/40 backdrop-blur-md z-[9999]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/40 rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-wood/5 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-400/5 blur-3xl rounded-full" />

            <button 
              onClick={() => {
                onClose();
                onReset();
              }}
              className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors text-ink-muted"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-wood/5 flex items-center justify-center text-wood">
                <Clock size={32} strokeWidth={1.5} />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl font-serif text-ink tracking-wide">
                  {t('report_weaving_dialog_title')}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed font-light">
                  {t('report_weaving_dialog_desc')}
                </p>
              </div>

              <div className="py-4 px-6 bg-ink/[0.02] rounded-2xl border border-ink/[0.05]">
                <p className="text-[11px] text-ink/40 tracking-wider leading-relaxed">
                  {t('report_weaving_dialog_notice')}
                </p>
              </div>

              <Button 
                onClick={onClose}
                className="w-full h-14 md:h-16 rounded-2xl md:rounded-3xl text-sm md:text-base tracking-[0.2em] shadow-xl shadow-wood/10"
              >
                {t('report_weaving_dialog_btn')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
