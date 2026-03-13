import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTest } from '../store/TestContext';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../i18n/LanguageContext';
import { Share2, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import { useEnergyReport } from '../hooks/useEnergyReport';
import { WeavingGuidanceDialog } from '../components/report/WeavingGuidanceDialog';
import { EnergyProfile } from '../components/report/EnergyProfile';
import { PsychInsight } from '../components/report/PsychInsight';
import { CardCollage } from '../components/report/CardCollage';

const WeavingLoader: React.FC<{ label?: string }> = ({ label }) => {
  const { t } = useLanguage();
  const displayLabel = label || t('report_weaving');
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-8">
      <div className="relative w-12 h-12">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-ink/5 border-t-ink/40 rounded-full"
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.8em] text-ink/20 animate-pulse">{displayLabel}</span>
    </div>
  );
};

export const EnergyReport: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const { selectedCards } = useTest();
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const {
    report,
    displayContent,
    isLoadingShared,
    showWeavingDialog,
    setShowWeavingDialog,
    selectedShareThumbnail,
    handleSelectThumbnail,
    isAiLoading,
  } = useEnergyReport(onReset);

  if (isLoadingShared) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <WeavingLoader label={t('report_weaving')} />
      </div>
    );
  }

  if (!report || !displayContent) return null;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/report/${report.id}`;
    const shareData = {
      title: report.todayTheme || `${t('report_title')} | EUNIE`,
      text: t('report_share_text'),
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(t('report_share_success'));
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const isGuest = report.isGuest;

  return (
    <div ref={reportRef} className="ma-container pt-12 md:pt-20 pb-48 md:pb-64 min-h-screen px-4 bg-[#FDFCF8]">
      <WeavingGuidanceDialog 
        isOpen={showWeavingDialog} 
        onClose={() => setShowWeavingDialog(false)} 
        onReset={onReset} 
      />

      {/* Editorial Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between items-center mb-16 md:mb-24 border-b border-ink/5 pb-8"
      >
        <button 
          onClick={onReset}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-ink-muted hover:text-ink transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('report_back')}
        </button>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block">{t('report_created_at')}</span>
          <span className="text-[10px] font-medium tracking-widest">{new Date(report.timestamp).toLocaleDateString()}</span>
        </div>
      </motion.div>

      {/* Hero Section: Massive Editorial Typography */}
      <section className="relative mb-20 md:mb-32">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1"
          >
            <span className="text-[14px] md:text-[10px] uppercase tracking-[0.8em] text-ink-muted mb-4 md:mb-6 block">{t('report_subtitle')}</span>
            <h1 className="text-[38px] md:text-[60px] font-serif italic font-extralight tracking-tighter-massive leading-[60.533px] md:leading-[111.533px] text-ink mb-8 text-left">
              {displayContent.todayTheme || "..."}
            </h1>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="hidden md:block vertical-text text-[10px] uppercase tracking-[0.8em] text-ink-muted opacity-30 h-48 border-l border-ink/10 pl-4"
          >
            Soul Resonance Analysis • EUNIE Editorial
          </motion.div>
        </div>
        
        {/* Decorative Skewed Line */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="h-px w-full bg-ink/10 origin-left mt-8 md:mt-16"
        />
      </section>

      <EnergyProfile report={report} />

      <PsychInsight isAiLoading={isAiLoading} displayContent={displayContent} />

      <CardCollage 
        report={report} 
        displayContent={displayContent} 
        selectedCards={selectedCards} 
        isAiLoading={isAiLoading} 
      />

      {/* Final Reflection: Simple & Bold */}
      <section className="text-left md:text-center py-24 md:py-32 border-t border-ink/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto space-y-10 flex flex-col items-center"
        >
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted block">{t('report_reflection')}</span>
          {isAiLoading ? (
            <div className="h-12 bg-ink/5 rounded-xl w-full max-w-2xl animate-pulse" />
          ) : (
            <p className="text-[28px] md:text-[35px] font-serif font-extralight leading-relaxed text-ink italic tracking-tight md:w-[900px] md:text-center p-[10px] md:ml-[10px] mb-0">
              「{displayContent.reflection || "..."}」
            </p>
          )}
          <div className="w-px h-16 bg-ink/10 mx-auto" />
        </motion.div>
      </section>

      {/* Share & CTA: Editorial Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
        <div className="space-y-12">
          <div className="space-y-6">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-ink-muted">{t('report_share_settings')}</h3>
            <p className="text-xs text-ink-muted leading-relaxed max-w-xs">
              {t('report_share_thumbnail_desc')}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(report.pairs ? report.pairs.flatMap(p => [p.image, p.word]) : [...selectedCards.images, ...selectedCards.words]).map((card, i) => (
              <button
                key={card.id}
                onClick={() => handleSelectThumbnail(card.imageUrl)}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                  selectedShareThumbnail === card.imageUrl 
                    ? 'border-ink shadow-xl scale-110 z-10' 
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-12">
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Button
              onClick={handleShare}
              disabled={!report.id}
              className="h-16 w-full gap-4 text-xs uppercase tracking-[0.4em] font-light bg-ink text-white hover:bg-ink/90"
            >
              <Share2 size={16} /> {t('report_share_energy_color')}
            </Button>
            <Button 
              onClick={onReset} 
              variant="outline" 
              className="h-16 w-full gap-4 text-xs uppercase tracking-[0.4em] font-light border-ink/10 hover:bg-ink/5"
            >
              <RefreshCw size={16} /> {t('report_new_test')}
            </Button>
          </div>

          {isGuest && (
            <div className="p-10 border border-ink/5 rounded-[3rem] text-center md:text-right space-y-6 w-full">
              <h2 className="font-serif text-xl tracking-widest">{t('report_guest_title')}</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                {t('report_guest_desc')}
              </p>
              <button 
                onClick={() => window.location.href = '/profile'} 
                className="text-[10px] uppercase tracking-[0.4em] text-ink border-b border-ink pb-1 hover:opacity-60 transition-opacity"
              >
                {t('report_signin_btn')}
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
