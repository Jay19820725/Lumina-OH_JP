import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PoeticLoading } from './PoeticLoading';

interface PsychInsightProps {
  isAiLoading: boolean;
  displayContent: any;
}

const WeavingPlaceholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-8">
    <PoeticLoading label={label} className="text-xl opacity-40" />
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-ink/[0.02] rounded-lg w-full" />
      <div className="h-4 bg-ink/[0.02] rounded-lg w-5/6" />
      <div className="h-4 bg-ink/[0.02] rounded-lg w-4/6" />
    </div>
  </div>
);

export const PsychInsight: React.FC<PsychInsightProps> = ({ isAiLoading, displayContent }) => {
  const { t } = useLanguage();

  return (
    <section className="relative mb-20 md:mb-32">
      <div className="flex items-center gap-8 mb-12">
        <h2 className="text-[15px] md:text-[10px] uppercase tracking-[0.8em] text-ink-muted whitespace-nowrap">{t('report_psych_insight')}</h2>
        <div className="h-px w-full bg-ink/5" />
      </div>
      
      <div className="relative">
        <div className={`grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 transition-all duration-1000 ${isAiLoading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="md:col-span-8">
            {isAiLoading ? (
              <WeavingPlaceholder label={t('report_loading_insight')} />
            ) : (
              <>
                <p className="text-[28px] md:text-[35px] font-serif leading-[1.4] font-extralight text-ink tracking-tight mb-10">
                  {displayContent.psychologicalInsight}
                </p>
                <div className="w-16 h-px bg-ink/20 mb-10" />
                <div className="columns-1 md:columns-2 gap-10 text-[16px] text-ink-muted leading-[2] font-light tracking-wide">
                  {displayContent.cardInterpretation}
                </div>
              </>
            )}
          </div>
          <div className="md:col-span-4 space-y-10">
            <div className="bg-ink/5 p-8 md:p-10 rounded-[2.5rem] space-y-6">
              <span className="text-[15px] md:text-[10px] uppercase tracking-[0.4em] text-ink-muted block border-b border-ink/10 pb-3">{t('report_five_element')}</span>
              {isAiLoading ? (
                <PoeticLoading label={t('report_analyzing')} className="text-xs opacity-40" />
              ) : (
                <p className="text-[15px] leading-[2] font-light text-ink tracking-wider italic">
                  {displayContent.fiveElementAnalysis}
                </p>
              )}
            </div>
            
            <div className="p-8 md:p-10 space-y-6 border border-ink/5 rounded-[2.5rem]">
              <span className="text-[15px] md:text-[10px] uppercase tracking-[0.4em] text-ink-muted block border-b border-ink/10 pb-3">{t('report_action')}</span>
              <div className="flex items-start gap-4">
                <RefreshCw size={14} className="text-ink-muted mt-1" />
                {isAiLoading ? (
                  <PoeticLoading label={t('report_loading_action')} className="text-xs opacity-40" />
                ) : (
                  <p className="text-sm leading-[1.8] font-light text-ink-muted">
                    {displayContent.actionSuggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
