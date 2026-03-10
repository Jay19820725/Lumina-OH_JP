import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { useTest } from '../store/TestContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { FiveElement } from '../core/types';
import { useLanguage } from '../i18n/LanguageContext';
import { Share2, Download, RefreshCw, ArrowLeft } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative w-16 h-16">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-ink/5 border-t-ink/20 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border border-ink/5 border-b-ink/10 rounded-full"
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.6em] text-ink/30 animate-pulse">{displayLabel}</span>
    </div>
  );
};

export const EnergyReport: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const { report, selectedCards, resetTest } = useTest();
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!report) return null;

  const handleSave = async () => {
    if (!reportRef.current) return;
    setIsSaving(true);
    try {
      // Create a temporary container to style for capture if needed, 
      // but here we'll just capture the ref.
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#F5F5F0',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });
      
      const link = document.createElement('a');
      link.download = `energy-report-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to save report:', error);
      alert(t('save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${t('report_title')} | JDear`,
      text: t('report_share_text'),
      url: window.location.href,
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
        await navigator.clipboard.writeText(window.location.href);
        alert(t('report_share_success'));
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const isAiLoading = !report.todayTheme && !report.isGuest;
  const isGuest = report.isGuest;

  const elements = [
    { key: FiveElement.WOOD, label: t('home_element_wood'), color: 'bg-wood', hex: '#8BA889' },
    { key: FiveElement.FIRE, label: t('home_element_fire'), color: 'bg-fire', hex: '#D98B73' },
    { key: FiveElement.EARTH, label: t('home_element_earth'), color: 'bg-earth', hex: '#C4B08B' },
    { key: FiveElement.METAL, label: t('home_element_metal'), color: 'bg-metal', hex: '#B8BFC6' },
    { key: FiveElement.WATER, label: t('home_element_water'), color: 'bg-water', hex: '#6B7B8C' },
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
    <div ref={reportRef} className="ma-container pt-12 md:pt-20 pb-48 md:pb-64 min-h-screen px-4 bg-[#F5F5F0]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-12 md:mb-16"
      >
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> {t('report_back')}
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.5, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-24 md:mb-48"
      >
        <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted mb-6 md:mb-8 block">{t('report_subtitle')}</span>
        <h1 className="font-serif mb-8 md:mb-12 tracking-[0.25em]">{t('report_title')}</h1>
        <div className="w-px h-12 bg-ink/10 mx-auto mb-8 md:mb-12" />
        <p className="text-[10px] tracking-[0.4em] text-ink-muted uppercase font-light">{t('report_created_at')}: {new Date(report.timestamp).toLocaleDateString()}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-20 mb-20 md:mb-32">
        {/* Energy Visualization */}
        <GlassCard className="lg:col-span-2 flex flex-col items-center justify-center py-12 md:py-24 px-4 md:px-6 overflow-hidden">
          <div className="relative w-full h-[300px] md:h-[450px] flex items-center justify-center">
            {/* Blurred Energy Rings (Background) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              {elements.map((el, i) => {
                const score = report.totalScores[el.key];
                const size = (window.innerWidth < 768 ? 100 : 150) + score * (window.innerWidth < 768 ? 1 : 2);
                return (
                  <motion.div
                    key={el.key}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.3 }}
                    transition={{ duration: 3, delay: i * 0.3, ease: "easeOut" }}
                    className={`absolute rounded-full ${el.color} blur-[60px] md:blur-[100px]`}
                    style={{ width: size, height: size }}
                  />
                );
              })}
            </div>
            
            <div className="w-full h-full z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#1A1A1A" strokeOpacity={0.05} />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#888888', fontSize: 12, fontWeight: 300, letterSpacing: '0.2em' }}
                  />
                  <Radar
                    name="Energy"
                    dataKey="value"
                    stroke="#1A1A1A"
                    strokeWidth={0.5}
                    fill="#1A1A1A"
                    fillOpacity={0.05}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center pointer-events-none">
              <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted block mb-1">{t('report_balance')}</span>
              <span className="text-5xl md:text-7xl font-serif font-extralight tracking-tighter">{report.balance_score}</span>
            </div>
          </div>

          <div className="w-full max-w-md mt-8 md:mt-16 space-y-6 md:space-y-8">
            {elements.map((el) => (
              <div key={el.key} className="space-y-2 md:space-y-3">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                  <span>{el.label}</span>
                  <span>{Math.round(report.totalScores[el.key])}%</span>
                </div>
                <div className="h-[1px] bg-ink/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${report.totalScores[el.key]}%` }}
                    transition={{ duration: 2, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full ${el.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Insights */}
        <div className="space-y-10 md:space-y-16">
          <GlassCard delay={0.4} className="p-10 md:p-14">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-ink-muted mb-6 md:mb-10">{t('report_dominant')}</h3>
            <p className="text-3xl md:text-4xl font-serif capitalize mb-4 md:mb-6 font-extralight tracking-widest">{translateElement(report.dominant_element)}</p>
            <p className="text-sm md:text-base text-ink-muted leading-[2] font-light">
              {t('report_dominant_desc').replace('{element}', translateElement(report.dominant_element))}
            </p>
          </GlassCard>

          <GlassCard delay={0.6} className="p-10 md:p-14">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-ink-muted mb-6 md:mb-10">{t('report_weak')}</h3>
            <p className="text-3xl md:text-4xl font-serif capitalize mb-4 md:mb-6 font-extralight tracking-widest">{translateElement(report.weak_element)}</p>
            <p className="text-sm md:text-base text-ink-muted leading-[2] font-light">
              {t('report_weak_desc').replace('{element}', translateElement(report.weak_element))}
            </p>
          </GlassCard>

          <div className="flex gap-6">
            <Button 
              variant="outline" 
              className="flex-1 gap-3 h-14 text-xs tracking-[0.2em]"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Download size={16} className={isSaving ? 'animate-pulse' : ''} /> 
              {isSaving ? t('saving') : t('report_save')}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-3 h-14 text-xs tracking-[0.2em]"
              onClick={handleShare}
            >
              <Share2 size={16} /> {t('report_share')}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Analysis Sections */}
      <div className="space-y-24 md:space-y-32 mb-32">
        {isGuest ? (
          <GlassCard className="p-12 md:p-20 text-center space-y-8 bg-wood/5 border-wood/20">
            <div className="space-y-4">
              <h2 className="font-serif text-2xl md:text-3xl tracking-widest text-wood">{t('report_guest_title')}</h2>
              <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-lg mx-auto">
                {t('report_guest_desc')}
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/profile'} 
              className="h-14 px-12 bg-wood hover:bg-wood/90 text-white tracking-widest"
            >
              {t('report_signin_btn')}
            </Button>
          </GlassCard>
        ) : (
          <>
            {/* Today's Theme */}
            <div className="text-center space-y-8">
              <span className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('report_today_theme')}</span>
              {isAiLoading ? (
                <WeavingLoader label={t('report_weaving')} />
              ) : (
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl md:text-4xl font-serif font-extralight italic tracking-widest text-ink leading-relaxed px-4"
                >
                  「{report.todayTheme}」
                </motion.h2>
              )}
            </div>

            {/* Pair Interpretations */}
            <div className="space-y-16 md:space-y-24">
              <div className="text-center space-y-6">
                <h2 className="font-serif font-extralight tracking-widest">{t('report_card_msg')}</h2>
                <div className="w-12 h-px bg-ink/10 mx-auto" />
              </div>
              
              {isAiLoading ? (
                <WeavingLoader label={t('report_interpreting')} />
              ) : (
                <div className="space-y-12">
                  <p className="text-base md:text-lg text-ink-muted leading-[2.2] font-light text-center max-w-3xl mx-auto px-6">
                    {report.cardInterpretation}
                  </p>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16"
                  >
                    {report.pairInterpretations?.map((interp, i) => {
                      const pair = report.pairs?.[i] || selectedCards.pairs?.[i];
                      if (!pair) return null;
                      return (
                        <GlassCard key={i} delay={0.2 * i} className="p-10 flex flex-col gap-8">
                          <div className="flex gap-3 justify-center">
                            <div className="w-20 h-32 rounded-xl overflow-hidden shadow-2xl border border-white/20">
                              <img src={pair.image.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-20 h-32 rounded-xl overflow-hidden shadow-2xl border border-white/20">
                              <img src={pair.word.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="space-y-6">
                            <p className="text-sm text-ink leading-[2] font-light italic text-center px-4">
                              "{pair.association}"
                            </p>
                            <div className="h-px bg-ink/10 w-8 mx-auto" />
                            <p className="text-sm text-ink-muted leading-[2.2] font-light">
                              {interp.text}
                            </p>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Psychological Insight & Five Element Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-32">
              <div className="space-y-12">
                <h3 className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('report_psych_insight')}</h3>
                {isAiLoading ? (
                  <WeavingLoader label={t('report_listening')} />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="prose prose-sm prose-ink max-w-none"
                  >
                    <p className="text-xl md:text-2xl font-serif leading-[2.2] font-extralight text-ink tracking-wide">
                      {report.psychologicalInsight}
                    </p>
                  </motion.div>
                )}
              </div>
              <div className="space-y-12">
                <h3 className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('report_five_element')}</h3>
                {isAiLoading ? (
                  <WeavingLoader label={t('report_analyzing')} />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/30 backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 border border-white/40 shadow-2xl shadow-ink/5"
                  >
                    <p className="text-base md:text-lg leading-[2.4] font-light text-ink-muted tracking-wider">
                      {report.fiveElementAnalysis}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Reflection & Action Suggestion */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-32 border-t border-ink/5 pt-24">
              <div className="space-y-12">
                <h3 className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('report_reflection')}</h3>
                {isAiLoading ? (
                  <WeavingLoader label={t('report_guiding')} />
                ) : (
                  <p className="text-lg md:text-xl font-serif font-extralight leading-relaxed text-ink italic">
                    「{report.reflection}」
                  </p>
                )}
              </div>
              <div className="space-y-12">
                <h3 className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('report_action')}</h3>
                {isAiLoading ? (
                  <WeavingLoader label={t('report_balancing')} />
                ) : (
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-wood/10 flex items-center justify-center flex-shrink-0">
                      <RefreshCw size={20} className="text-wood" />
                    </div>
                    <p className="text-base md:text-lg leading-[2.2] font-light text-ink-muted">
                      {report.actionSuggestion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-24 text-center">
        <Button onClick={onReset} variant="outline" className="gap-2 h-14 px-10">
          <RefreshCw size={16} /> {t('report_new_test')}
        </Button>
      </div>
    </div>
  );
};
