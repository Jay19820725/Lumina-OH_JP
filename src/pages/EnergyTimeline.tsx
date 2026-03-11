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
  BarChart3
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

const EMOTIONS: { tag: EmotionTag; label: string; icon: React.ReactNode; color: string }[] = [
  { tag: 'calm', label: '穏やか', icon: <Smile size={18} />, color: 'bg-emerald-100 text-emerald-600' },
  { tag: 'anxious', label: '不安', icon: <AlertCircle size={18} />, color: 'bg-rose-100 text-rose-600' },
  { tag: 'inspired', label: 'インスピレーション', icon: <Sparkles size={18} />, color: 'bg-indigo-100 text-indigo-600' },
  { tag: 'tired', label: 'お疲れ', icon: <Coffee size={18} />, color: 'bg-amber-100 text-amber-600' },
];

export const EnergyTimeline: React.FC<EnergyTimelineProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const { setReport } = useTest();
  const { language, t } = useLanguage();
  const [reports, setReports] = useState<AnalysisReport[]>([]);
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
        console.log("EnergyTimeline: Fetching reports for user:", user.uid);
        // Fetch Reports
        const reportRes = await fetch(`/api/reports/${user.uid}`);
        if (!reportRes.ok) {
          console.error("EnergyTimeline: Failed to fetch reports. Status:", reportRes.status);
          throw new Error(`Failed to fetch reports: ${reportRes.status}`);
        }
        const reportData = await reportRes.json();
        console.log("EnergyTimeline: Fetched reports count:", Array.isArray(reportData) ? reportData.length : 0);
        console.log("EnergyTimeline: First report (if any):", Array.isArray(reportData) && reportData.length > 0 ? reportData[0] : "None");
        setReports(Array.isArray(reportData) ? reportData : []);

        // Fetch Journals if premium
        if (profile?.role === 'premium_member') {
          const journalData = await journalService.getEntries(user.uid);
          setJournals(journalData);
        }
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile]);

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [
      ...reports.map(r => ({ type: 'report' as const, data: r, timestamp: r.timestamp })),
      ...journals.map(j => ({ 
        type: 'journal' as const, 
        data: j, 
        timestamp: j.date?.toDate ? j.date.toDate().getTime() : (j.created_at?.toDate ? j.created_at.toDate().getTime() : Date.now())
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
    if (!window.confirm('この日誌を削除してもよろしいですか？')) return;
    try {
      await journalService.deleteEntry(id);
      setJournals(prev => prev.filter(j => j.id !== id));
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
    }
  };

  const translateElement = (el: string) => {
    const map: Record<string, Record<string, string>> = {
      'ja': {
        wood: '木',
        fire: '火',
        earth: '土',
        metal: '金',
        water: '水',
        None: 'なし'
      },
      'zh': {
        wood: '木',
        fire: '火',
        earth: '土',
        metal: '金',
        water: '水',
        None: '無'
      }
    };
    const currentMap = map[language] || map['zh'];
    return currentMap[el] || el;
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
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted block">Energy Timeline</span>
          <h1 className="font-serif tracking-widest text-3xl md:text-4xl">{t('timeline_title')}</h1>
          <div className="w-12 h-px bg-ink/10 mx-auto" />
          <p className="text-sm md:text-lg text-ink-muted font-light tracking-widest leading-relaxed">
            {t('timeline_description')}
          </p>
        </header>

        {/* Weekly Insight Section (Mocked for now) */}
        {profile?.role === 'premium_member' && timelineItems.length > 0 && (
          <GlassCard className="mb-16 p-8 md:p-12 bg-wood/5 border-wood/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-wood/10 flex items-center justify-center text-wood">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-lg font-serif tracking-widest">今週のエネルギー概況</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span>上昇傾向のエネルギー</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  最近の診断では「木」のエネルギーが活発です。新しいアイデアやプロジェクトを始めるのに最適な時期かもしれません。
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-muted">
                  <Activity size={14} className="text-indigo-500" />
                  <span>情緒とエネルギーの相関</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  「穏やか」な気分の日は、エネルギーバランスが平均して 85% 以上と非常に安定しています。
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="flex justify-between items-center mb-12">
          <h3 className="text-[10px] uppercase tracking-[0.4em] text-ink-muted">Timeline</h3>
          {profile?.role === 'premium_member' && (
            <Button 
              onClick={() => setIsAddingJournal(!isAddingJournal)}
              variant={isAddingJournal ? 'outline' : 'primary'}
              className="h-10 px-4 gap-2 text-[10px] tracking-widest"
            >
              {isAddingJournal ? 'キャンセル' : <><Plus size={14} /> 日誌を記す</>}
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
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted block">今の気分</label>
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
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted block">今日の洞察</label>
                    <textarea
                      value={insight}
                      onChange={(e) => setInsight(e.target.value)}
                      placeholder="今日、あなたの心に浮かんだ気づきは何ですか？"
                      className="w-full h-32 bg-white/50 border border-ink/5 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted block">明日の意圖</label>
                    <input
                      type="text"
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      placeholder="明日、どのようなエネルギーで過ごしたいですか？"
                      className="w-full bg-white/50 border border-ink/5 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full h-14">
                    {submitting ? '保存中...' : '日誌を保存する'}
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
                      {item.type === 'report' ? 'Energy Report' : 'Energy Journal'}
                    </span>
                  </div>

                  {item.type === 'report' ? (
                    <GlassCard 
                      onClick={() => handleViewReport(item.data)}
                      className="p-6 md:p-8 hover:bg-white/80 transition-all cursor-pointer group border-emerald-500/10 active:scale-[0.98]"
                    >
                      <div className={`flex flex-col ${i % 2 === 0 ? 'md:items-end' : 'md:items-start'} gap-4`}>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-widest text-ink-muted block mb-1">優位な要素</span>
                            <span className="text-lg font-serif capitalize">{translateElement(item.data.dominantElement)}</span>
                          </div>
                          <div className="h-8 w-px bg-ink/5" />
                          <div className="text-left">
                            <span className="text-[10px] uppercase tracking-widest text-ink-muted block mb-1">バランス</span>
                            <span className="text-lg font-serif">{item.data.balanceScore}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-ink-muted group-hover:text-ink transition-colors">
                          詳細を見る <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
                            <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted">洞察</span>
                            <p className="text-sm leading-relaxed text-ink font-light line-clamp-3">{item.data.insight}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted">意圖</span>
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
