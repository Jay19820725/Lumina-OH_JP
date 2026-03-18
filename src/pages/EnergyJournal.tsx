import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { journalService } from '../services/journalService';
import { EmotionTag, EnergyJournalEntry } from '../core/types';
import { BookOpen, Plus, Trash2, Calendar, Smile, AlertCircle, Sparkles, Coffee } from 'lucide-react';

export const EnergyJournal: React.FC = () => {
  const { user, profile, isPremium, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<EnergyJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [emotion, setEmotion] = useState<EmotionTag>('calm');
  const [insight, setInsight] = useState('');
  const [intention, setIntention] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const EMOTIONS = useMemo(() => [
    { tag: 'calm' as EmotionTag, label: t('journal_emotion_calm'), icon: <Smile size={18} />, color: 'bg-emerald-100 text-emerald-600' },
    { tag: 'anxious' as EmotionTag, label: t('journal_emotion_anxious'), icon: <AlertCircle size={18} />, color: 'bg-rose-100 text-rose-600' },
    { tag: 'inspired' as EmotionTag, label: t('journal_emotion_inspired'), icon: <Sparkles size={18} />, color: 'bg-indigo-100 text-indigo-600' },
    { tag: 'tired' as EmotionTag, label: t('journal_emotion_tired'), icon: <Coffee size={18} />, color: 'bg-amber-100 text-amber-600' },
  ], [t]);

  useEffect(() => {
    if (user && isPremium) {
      fetchEntries();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, profile, isPremium, authLoading]);

  const fetchEntries = async () => {
    if (!user) return;
    try {
      const data = await journalService.getEntries(user.uid);
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setIsAdding(false);
      await fetchEntries();
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('journal_delete_confirm'))) return;
    try {
      await journalService.deleteEntry(id);
      await fetchEntries();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="ma-container py-32 flex items-center justify-center">
        <div className="animate-pulse-soft text-ink-muted uppercase tracking-widest text-xs">{t('journal_loading')}</div>
      </div>
    );
  }

  if (profile && !isPremium) {
    return (
      <div className="ma-container py-20 px-4 text-center">
        <GlassCard className="max-w-2xl mx-auto p-12 space-y-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500">
            <BookOpen size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-serif tracking-widest">{t('journal_title')}</h2>
            <p className="text-ink-muted leading-relaxed">
              {t('journal_premium_desc')}
            </p>
          </div>
          <Button onClick={() => window.location.href = '/profile'} className="px-12">
            {t('journal_check_membership')}
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="ma-container py-12 md:py-20 min-h-screen px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 md:mb-24 space-y-6">
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted block">{t('premium_feature')}</span>
          <h1 className="font-serif tracking-widest text-3xl md:text-4xl">{t('journal_title')}</h1>
          <div className="w-12 h-px bg-ink/10 mx-auto" />
          <p className="text-sm md:text-lg text-ink-muted font-light tracking-widest leading-relaxed">
            {t('journal_desc')}
          </p>
        </header>

        <div className="flex justify-end mb-8">
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            variant={isAdding ? 'outline' : 'primary'}
            className="gap-2"
          >
            {isAdding ? t('cancel') : <><Plus size={18} /> {t('journal_write_new')}</>}
          </Button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <GlassCard className="p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
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

        <div className="space-y-6">
          <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-8">{t('journal_history')}</h3>
          {entries.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <p className="font-serif italic text-sm md:text-base">{t('journal_empty')}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {entries.map((entry, i) => {
                const em = EMOTIONS.find(e => e.tag === entry.emotion_tag);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <GlassCard className="p-8 md:p-10 group">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-6 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <Calendar size={14} className="text-ink-muted mb-1" />
                              <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                                {entry.date ? new Date(entry.date).toLocaleDateString() : '---'}
                              </span>
                            </div>
                            <div className="h-8 w-px bg-ink/5" />
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-widest ${em?.color}`}>
                              {em?.icon}
                              {em?.label}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted">{t('journal_label_insight')}</span>
                              <p className="text-sm leading-relaxed text-ink font-light">{entry.insight}</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-[8px] uppercase tracking-[0.4em] text-ink-muted">{t('journal_label_intention')}</span>
                              <p className="text-sm leading-relaxed text-ink-muted italic">「{entry.intention}」</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => entry.id && handleDelete(entry.id)}
                          className="self-start p-2 text-ink-muted hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
