import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

interface GuidanceBarProps {
  hintKey: TranslationKey;
}

export const GuidanceBar: React.FC<GuidanceBarProps> = ({ hintKey }) => {
  const { t } = useLanguage();
  const htmlContent = t(hintKey);

  return (
    <div className="fixed bottom-28 md:top-24 md:bottom-auto left-0 right-0 z-[60] flex justify-center px-6 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={hintKey}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-2xl md:rounded-full px-5 py-3 md:px-6 md:py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] flex items-center gap-3 pointer-events-auto max-w-[90vw] md:max-w-none"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-wood/10 flex items-center justify-center text-wood">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles size={14} />
            </motion.div>
          </div>
          <p 
            className="text-[11px] md:text-sm text-ink/80 tracking-widest font-light leading-relaxed"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
