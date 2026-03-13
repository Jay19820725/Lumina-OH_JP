import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { EnergyReportData } from '../../core/types';

interface CardCollageProps {
  report: EnergyReportData;
  displayContent: any;
  selectedCards: any;
  isAiLoading: boolean;
}

export const CardCollage: React.FC<CardCollageProps> = ({ report, displayContent, selectedCards, isAiLoading }) => {
  const { t } = useLanguage();

  return (
    <section className="mb-20 md:mb-32">
      <div className="flex items-center gap-8 mb-16">
        <div className="h-px w-full bg-ink/5" />
        <h2 className="text-[12px] uppercase tracking-[0.8em] text-ink-muted whitespace-nowrap">{t('report_card_msg')}</h2>
        <div className="h-px w-full bg-ink/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-16">
        {[0, 1, 2].map((i) => {
          const interp = displayContent.pairInterpretations?.[i];
          const pair = (report.pairs && report.pairs.length > i) ? report.pairs[i] : selectedCards.pairs?.[i];
          
          if (!pair) return null;
          
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="space-y-10"
            >
              <div className="relative h-72 flex items-center justify-center">
                {/* Image Card (Back) */}
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: -10 }}
                  className="absolute w-32 h-48 rounded-xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-8 -translate-x-14 z-10"
                >
                  <img src={pair.image.imageUrl} alt="" className="w-full h-full object-cover" />
                </motion.div>
                {/* Word Card (Front) */}
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 10 }}
                  className="absolute w-32 h-48 rounded-xl overflow-hidden shadow-2xl border-4 border-white transform rotate-8 translate-x-14 z-20"
                >
                  <img src={pair.word.imageUrl} alt="" className="w-full h-full object-cover" />
                </motion.div>
                <div className="absolute inset-0 bg-ink/[0.02] rounded-[3rem] -z-10" />
              </div>
              
              <div className="space-y-4 text-left px-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted">Resonance {i + 1}</span>
                <p className="text-[15px] text-ink leading-[1.8] font-light italic">
                  "{pair.association}"
                </p>
                <div className="h-px bg-ink/10 w-6 mx-0" />
                {isAiLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-ink/5 rounded w-full" />
                    <div className="h-4 bg-ink/5 rounded w-2/3" />
                  </div>
                ) : (
                  <p className="text-[15px] text-ink-muted leading-[1.8] font-light">
                    {interp?.text || "..."}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
