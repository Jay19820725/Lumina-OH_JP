import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { 
  Calendar, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  Activity, 
  Plus, 
  Trash2, 
  Smile, 
  AlertCircle, 
  Coffee,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { AnalysisReport, EnergyJournalEntry, EmotionTag } from '../core/types';
import { useTest } from '../store/TestContext';
import { journalService } from '../services/journalService';
import { useLanguage } from '../i18n/LanguageContext';

interface EnergyTimelineProps {
  onNavigate: (page: string) => void;
}

type TimelineItem = 
  | { type: 'report'; data: AnalysisReport; timestamp: number }
  | { type: 'journal'; data: EnergyJournalEntry; timestamp: number };

export const EnergyTimeline: React.FC<EnergyTimelineProps> = ({ onNavigate }) => {
  const { user, profile, isPremium } = useAuth();
  const { setReport } = useTest();
  const { language, t } = useLanguage();

  const EMOTIONS = useMemo(() => [
    { tag: 'calm' as EmotionTag, label: t('journal_emotion_calm'), icon: <Smile size={18} />, color: 'bg-emerald-100 text-emerald-600' },
    { tag: 'anxious' as EmotionTag, label: t('journal_emotion_anxious'), icon: <AlertCircle size={18} />, color: 'bg-rose-100 text-rose-600' },
    { tag: 'inspired' as EmotionTag, label: t('journal_emotion_inspired'), icon: <Sparkles size={18} />, color: 'bg-indigo-100 text-indigo-600' },
    { tag: 'tired' as EmotionTag, label: t('journal_emotion_tired'), icon: <Coffee size={18} />, color: 'bg-amber-100 text-amber-600' },
  ], [t]);

  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [hasOtherLang, setHasOtherLang] = useState(false);
  const [journals, setJournals] = useState<EnergyJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingJournal, setIsAddingJournal] = useState(false);

  // Journal Form state
  const [emotion, setEmotion] = useState<EmotionTag>('calm');
  const [insight, setInsight] = useState('');
  const [intention, setIntention] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("EnergyTimeline: Fetching reports for user:", user.uid, "lang:", language);
        // Fetch Reports
        const reportRes = await fetch(`/api/reports/${user.uid}?lang=${language}`);
        if (!reportRes.ok) {
          console.error("EnergyTimeline: Failed to fetch reports. Status:", reportRes.status);
          throw new Error(`Failed to fetch reports: ${reportRes.status}`);
        }
        const reportData = await reportRes.json();
        setReports(Array.isArray(reportData.reports) ? reportData.reports : []);
        setHasOtherLang(reportData.hasOtherLang || false);

        // Fetch Journals if premium
        if (isPremium) {
          const journalData = await journalService.getEntries(user.uid);
          // Filter journals by language if they have a lang field
          // For now, journals don't have a lang field in the schema, but we could add it.
          // The user didn't explicitly ask for journals to be isolated, but it's better.
          setJournals(journalData);
        }
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile, isPremium, language]);

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [
      ...reports.map(r => ({ type: 'report' as const, data: r, timestamp: r.timestamp })),
      ...journals.map(j => ({ 
        type: 'journal' as const, 
        data: j, 
        timestamp: j.date ? new Date(j.date).getTime() : (j.created_at ? new Date(j.created_at).getTime() : Date.now())
      }))
    ];
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [reports, journals]);

  const handleViewReport = (report: AnalysisReport) => {
    setReport(report);
    onNavigate('report');
  };

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !insight || !intention) return;

    setSubmitting(true);
    try {
      await journalService.addEntry(user.uid, {
        emotion_tag: emotion,
        insight,
        intention
      });
      setInsight('');
      setIntention('');
      setIsAddingJournal(false);
      // Refresh journals
      const journalData = await journalService.getEntries(user.uid);
      setJournals(journalData);
    } catch (error) {
      console.error("Failed to add journal entry:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!window.confirm(t('journal_delete_confirm'))) return;
    try {
      await journalService.deleteEntry(id);
      setJournals(prev => prev.filter(j => j.id !== id));
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
    }
  };

  const translateElement = (el: string) => {
    const key = `element_${el.toLowerCase()}` as any;
    // Check if the key exists in translations, otherwise return original
    return t(key) || el;
  };

  const formatDate = (timestamp: number) => {
    const locale = language === 'ja' ? 'ja-JP' : 'zh-TW';
    return new Date(timestamp).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="ma-container py-32 flex items-center justify-center">
        <div className="animate-pulse-soft text-ink-muted uppercase tracking-widest text-xs">{t('loading_timeline')}</div>
      </div>
    );
  }

  return (
    <div className="ma-container py-12 md:py-20 min-h-screen px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 md:mb-24 space-y-6">
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted block">{t('timeline_title')}</span>
          <h1 className="font-serif tracking-widest text-3xl md:text-4xl">{t('nav_history')}</h1>
          <div className="w-12 h-px bg-ink/10 mx-auto" />
          <p className="text-sm md:text-lg text-ink-muted font-light tracking-widest leading-relaxed">
            {t('timeline_description')}
          </p>
        </header>

        {hasOtherLang && (
          <div className="mb-12 p-4 bg-ink/5 border border-ink/10 rounded-2xl flex items-center gap-4 text-ink-muted">
            <Info size={18} className="shrink-0" />
            <p className="text-xs tracking-widest leading-relaxed">
              {t('timeline_other_lang_notice')}
            </p>
          </div>
        )}

        {/* Weekly Insight Section (Mocked for now) */}
        {isPremium && timelineItems.length > 0 && (
          <GlassCard className="mb-16 p-8 md:p-12 bg-wood/5 border-wood/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-wood/10 flex items-center justify-center text-wood">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-lg font-serif tracking-widest">{t('timeline_weekly_insight')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span>{t('timeline_trending_up')}</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {t('timeline_insight_wood')}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
                  <Activity size={14} className="text-indigo-500" />
                  <span>{t('timeline_emotional_correlation')}</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {t('timeline_insight_calm')}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="flex justify-between items-center mb-12">
          <h3 className="text-[10px] uppercase tracking-[0.4em] text-ink-muted">{t('nav_history')}</h3>
          {isPremium && (
            <Button 
              onClick={() => setIsAddingJournal(!isAddingJournal)}
              variant={isAddingJournal ? 'outline' : 'primary'}
              className="h-10 px-4 gap-2 text-[10px] tracking-widest"
            >
              {isAddingJournal ? t('cancel') : <><Plus size={14} /> {t('timeline_write_journal')}</>}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {isAddingJournal && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-16"
            >
              <GlassCard className="p-8 md:p-12">
                <form onSubmit={handleAddJournal} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted block">{t('journal_label_emotion')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {EMOTIONS.map((em) => (
                        <button
                          key={em.tag}
                          type="button"
                          onClick={() => setEmotion(em.tag)}
                          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                            emotion === em.tag 
                              ? `${em.color} border-transparent shadow-sm scale-105` 
                              : 'bg-white/50 border-ink/5 text-ink-muted hover:bg-white/80'
                          }`}
                        >
                          {em.icon}
                          <span className="text-xs tracking-widest">{em.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted block">{t('journal_label_insight')}</label>
                    <textarea
                      value={insight}
                      onChange={(e) => setInsight(e.target.value)}
                      placeholder={t('journal_placeholder_insight')}
                      className="w-full h-32 bg-white/50 border border-ink/5 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted block">{t('journal_label_intention')}</label>
                    <input
                      type="text"
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      placeholder={t('journal_placeholder_intention')}
                      className="w-full bg-white/50 border border-ink/5 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full h-14">
                    {submitting ? t('saving') : t('save')}
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative space-y-12">
          {/* Vertical Line */}
          <div className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-px bg-ink/5 -translate-x-1/2" />

          {timelineItems.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <p className="font-serif italic text-sm md:text-base">{t('timeline_empty')}</p>
            </div>
          ) : (
            timelineItems.map((item, i) => (
              <motion.div
                key={item.type === 'report' ? item.data.id : item.data.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 ${
                  i % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-[19px] md:left-1/2 w-10 h-10 rounded-full bg-bg-washi border border-ink/5 flex items-center justify-center -translate-x-1/2 z-10 shadow-sm">
                  {item.type === 'report' ? (
                    <Activity size={16} className="text-emerald-500" />
                  ) : (
                    <BookOpen size={16} className="text-indigo-500" />
                  )}
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[calc(50%-40px)] ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'} pl-12 md:pl-0`}>
                  <div className={`flex flex-col ${i % 2 === 0 ? 'md:items-end' : 'md:items-start'} mb-2`}>
                    <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                      {formatDate(item.timestamp)}
                    </span>
                    <span className={`text-[8px] uppercase tracking-[0.4em] font-medium mt-1 ${
                      item.type === 'report' ? 'text-emerald-500' : 'text-indigo-500'
                    }`}>
                      {item.type === 'report' ? t('test_title_revealed') : t('journal_title')}
                    </span>
                  </div>

                  {item.type === 'report' ? (
                    <GlassCard 
                      onClick={() => handleViewReport(item.data)}
                      className="p-6 md:p-8 hover:bg-white/80 transition-all cursor-pointer group border-emerald-500/10 active:scale-[0.98]"
                    >
                      <div className={`flex flex-col ${i % 2 === 0 ? 'md:items-end' : 'md:items-start'} gap-4`}>
                        {!item.data.isAiComplete && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-wood/5 text-wood text-[8px] uppercase tracking-[0.4em] animate-pulse">
                            <Sparkles size={10} /> {t('report_weaving')}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={i % 2 === 0 ? 'text-right' : 'text-left'}>
                            <span className="text-[10px] uppercase tracking-widest text-ink-muted block mb-1">{t('report_dominant')}</span>
                            <span className="text-lg font-serif capitalize">{translateElement(item.data.dominantElement)}</span>
                          </div>
                          <div className="h-8 w-px bg-ink/5" />
                          <div className={i % 2 === 0 ? 'text-left' : 'text-right'}>
                            <span className="text-[10px] uppercase tracking-widest text-ink-muted block mb-1">{t('report_balance')}</span>
                            <span className="text-lg font-serif">{item.data.balanceScore}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-ink-muted group-hover:text-ink transition-colors">
                          {t('report_view_detail')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-6 md:p-8 border-indigo-500/10 group hover:bg-white/80 transition-all">
                      <div className={`flex flex-col ${i % 2 === 0 ? 'md:items-end' : 'md:items-start'} gap-4`}>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-widest ${
                          EMOTIONS.find(e => e.tag === item.data.emotion_tag)?.color
                        }`}>
                          {EMOTIONS.find(e => e.tag === item.data.emotion_tag)?.icon}
                          {EMOTIONS.find(e => e.tag === item.data.emotion_tag)?.label}
                        </div>
                        <div className="space-y-4 w-full">
                          <div className="space-y-1">
                            <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted">{t('journal_label_insight')}</span>
                            <p className="text-sm leading-relaxed text-ink font-light line-clamp-3">{item.data.insight}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted">{t('journal_label_intention')}</span>
                            <p className="text-sm leading-relaxed text-ink-muted italic">「{item.data.intention}」</p>
                          </div>
                        </div>
                        <button
                          onClick={() => item.data.id && handleDeleteJournal(item.data.id)}
                          className="p-1 text-ink-muted hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </GlassCard>
                  )}
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block md:w-[calc(50%-40px)]" />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
