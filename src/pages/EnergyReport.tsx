import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTest } from '../store/TestContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { FiveElement } from '../core/types';
import { useLanguage } from '../i18n/LanguageContext';
import { Share2, RefreshCw, ArrowLeft } from 'lucide-react';

import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';

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
  const { report, selectedCards, setReport } = useTest();
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [selectedShareThumbnail, setSelectedShareThumbnail] = useState<string | null>(report?.shareThumbnail || null);

  // Handle shared report fetching
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/report/')) {
      const reportId = path.split('/').pop();
      if (reportId && (!report || report.id !== reportId)) {
        setIsLoadingShared(true);
        
        let retryCount = 0;
        const maxRetries = 5;

        const fetchReport = async () => {
          try {
            const res = await fetch(`/api/report/${reportId}`);
            const data = await res.json();
            
            if (data && !data.error) {
              setReport(data);
              // If it's an empty report (no AI content yet), retry a few times
              if (!data.isAiComplete && retryCount < maxRetries) {
                retryCount++;
                console.log(`Report ${reportId} is still weaving... retry ${retryCount}/${maxRetries}`);
                setTimeout(fetchReport, 3000);
              } else {
                setIsLoadingShared(false);
              }
            } else {
              console.error('API returned error or no data for report:', reportId);
              onReset();
              setIsLoadingShared(false);
            }
          } catch (err) {
            console.error('Failed to fetch shared report:', err);
            onReset();
            setIsLoadingShared(false);
          }
        };
        
        fetchReport();
      }
    }
  }, [setReport, report, onReset]);

  if (isLoadingShared) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <WeavingLoader label={t('report_weaving')} />
      </div>
    );
  }

  if (!report) return null;

  const handleSelectThumbnail = async (url: string) => {
    setSelectedShareThumbnail(url);
    if (report.id) {
      try {
        const response = await fetch(`/api/reports/${report.id}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareThumbnail: url })
        });
        if (response.ok) {
          setReport({ ...report, shareThumbnail: url });
        }
      } catch (error) {
        console.error('Failed to update share thumbnail:', error);
      }
    }
  };

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

  const isAiLoading = !report.isAiComplete && !report.todayTheme;
  const { language: currentLangCode } = useLanguage();

  // Determine which content to show based on current language
  const displayContent = React.useMemo(() => {
    if (!report.multilingualContent) return report;
    
    const langKey = currentLangCode === 'ja' ? 'ja-JP' : 'zh-TW';
    const langContent = report.multilingualContent[langKey];
    
    if (!langContent) return report;
    
    return {
      ...report,
      ...langContent
    };
  }, [report, currentLangCode]);

  // Mark report as seen when fully loaded
  useEffect(() => {
    if (report?.id && report.isAiComplete) {
      localStorage.setItem('lastSeenReportId', report.id);
    }
  }, [report?.id, report.isAiComplete]);
  const isGuest = report.isGuest;

  const elements = [
    { key: FiveElement.WOOD, label: t('home_element_wood'), color: 'bg-wood', hex: '#A8C97F' },
    { key: FiveElement.FIRE, label: t('home_element_fire'), color: 'bg-fire', hex: '#E95464' },
    { key: FiveElement.EARTH, label: t('home_element_earth'), color: 'bg-earth', hex: '#FFB11B' },
    { key: FiveElement.METAL, label: t('home_element_metal'), color: 'bg-metal', hex: '#F8FBF8' },
    { key: FiveElement.WATER, label: t('home_element_water'), color: 'bg-water', hex: '#33A6B8' },
  ];

  const chartData = elements.map(el => ({
    subject: el.label,
    value: report.totalScores[el.key],
    fullMark: 100,
  }));

  const translateElement = (el: string) => {
    const map: Record<string, string> = {
      wood: t('home_element_wood'),
      fire: t('home_element_fire'),
      earth: t('home_element_earth'),
      metal: t('home_element_metal'),
      water: t('home_element_water'),
      None: t('none')
    };
    return map[el] || el;
  };

  return (
    <div ref={reportRef} className="ma-container pt-12 md:pt-20 pb-48 md:pb-64 min-h-screen px-4 bg-[#FDFCF8]">
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

      {/* Energy Profile: Asymmetric Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 mb-20 md:mb-32 items-center -mt-[100px]">
        <div className="lg:col-span-7 relative">
          <div className="absolute -top-12 -left-12 text-[15vw] font-serif font-black text-ink/[0.02] pointer-events-none select-none">
            {report.balanceScore}
          </div>
          <div className="relative aspect-square w-full max-w-[450px] mx-auto">
            {/* Blurred Energy Aura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              {elements.map((el, i) => {
                const score = report.totalScores[el.key];
                const size = 120 + score * 2;
                return (
                  <motion.div
                    key={el.key}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 3, delay: i * 0.3 }}
                    className={`absolute rounded-full ${el.color} blur-[80px] md:blur-[100px]`}
                    style={{ width: size, height: size }}
                  />
                );
              })}
            </div>
            
            <div className="w-full h-full z-10 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#1A1A1A" strokeOpacity={0.08} />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#1A1A1A', fontSize: 10, fontWeight: 300, letterSpacing: '0.3em' }}
                  />
                  <Radar
                    name="Energy"
                    dataKey="value"
                    stroke="#1A1A1A"
                    strokeWidth={0.5}
                    fill="#1A1A1A"
                    fillOpacity={0.08}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[13px] uppercase tracking-[0.4em] text-ink-muted">{t('report_balance')}</span>
              <div className="h-px flex-1 bg-ink/5" />
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-serif font-extralight tracking-tighter">{report.balanceScore}</span>
              <span className="text-xs uppercase tracking-widest text-ink-muted">/ 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <span className="text-[12px] uppercase tracking-[0.4em] text-ink-muted block">{t('report_dominant')}</span>
              <h3 className="text-2xl font-serif italic tracking-widest">{translateElement(report.dominantElement)}</h3>
              <p className="text-[15px] text-ink-muted leading-relaxed font-light">
                {t('report_dominant_desc').replace('{element}', translateElement(report.dominantElement))}
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-[12px] uppercase tracking-[0.4em] text-ink-muted block">{t('report_weak')}</span>
              <h3 className="text-2xl font-serif italic tracking-widest">{translateElement(report.weakElement)}</h3>
              <p className="text-[15px] text-ink-muted leading-relaxed font-light">
                {t('report_weak_desc').replace('{element}', translateElement(report.weakElement))}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Insight: Editorial Columns */}
      <section className="relative mb-20 md:mb-32">
        <div className="flex items-center gap-8 mb-12">
          <h2 className="text-[10px] uppercase tracking-[0.8em] text-ink-muted whitespace-nowrap">{t('report_psych_insight')}</h2>
          <div className="h-px w-full bg-ink/5" />
        </div>
        
        <div className="relative">
          <AnimatePresence>
            {isAiLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FDFCF8]/80 backdrop-blur-sm rounded-3xl"
              >
                <WeavingLoader label={t('report_weaving')} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 transition-all duration-1000 ${isAiLoading ? 'blur-md opacity-20' : 'blur-0 opacity-100'}`}>
            <div className="md:col-span-8">
              <p className="text-[28px] md:text-[35px] font-serif leading-[1.4] font-extralight text-ink tracking-tight mb-10">
                {displayContent.psychologicalInsight}
              </p>
              <div className="w-16 h-px bg-ink/20 mb-10" />
              <div className="columns-1 md:columns-2 gap-10 text-[16px] text-ink-muted leading-[2] font-light tracking-wide">
                {displayContent.cardInterpretation}
              </div>
            </div>
            <div className="md:col-span-4 space-y-10">
              <div className="bg-ink/5 p-8 md:p-10 rounded-[2.5rem] space-y-6">
                <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block border-b border-ink/10 pb-3">{t('report_five_element')}</span>
                <p className="text-[15px] leading-[2] font-light text-ink tracking-wider italic">
                  {displayContent.fiveElementAnalysis}
                </p>
              </div>
              
              <div className="p-8 md:p-10 space-y-6 border border-ink/5 rounded-[2.5rem]">
                <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block border-b border-ink/10 pb-3">{t('report_action')}</span>
                <div className="flex items-start gap-4">
                  <RefreshCw size={14} className="text-ink-muted mt-1" />
                  <p className="text-sm leading-[1.8] font-light text-ink-muted">
                    {displayContent.actionSuggestion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Collage: Visual Narrative */}
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
                  <p className="text-[15px] text-ink-muted leading-[1.8] font-light">
                    {interp?.text || "..."}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Final Reflection: Simple & Bold */}
      <section className="text-left md:text-center py-24 md:py-32 border-t border-ink/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto space-y-10 flex flex-col items-center"
        >
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted block">{t('report_reflection')}</span>
          <p className="text-[28px] md:text-[35px] font-serif font-extralight leading-relaxed text-ink italic tracking-tight md:w-[900px] md:text-center p-[10px] md:ml-[10px] mb-0">
            「{displayContent.reflection || "..."}」
          </p>
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
