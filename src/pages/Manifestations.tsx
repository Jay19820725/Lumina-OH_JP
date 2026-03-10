import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Star, Plus, X, Calendar, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { manifestationService } from '../services/manifestationService';
import { useAuth } from '../hooks/useAuth';
import { Manifestation, ManifestationDeadlineOption } from '../core/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

export const Manifestations: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWish, setNewWish] = useState('');
  const [deadline, setDeadline] = useState<ManifestationDeadlineOption>('6_months');
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Manifestation[]>([]);

  useEffect(() => {
    if (user) {
      fetchManifestations();
      checkReminders();
    }
  }, [user]);

  const fetchManifestations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await manifestationService.getUserManifestations(user.uid);
      setManifestations(data);
    } catch (err) {
      console.error('Failed to fetch manifestations:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkReminders = async () => {
    if (!user) return;
    try {
      const upcoming = await manifestationService.checkUpcomingReminders(user.uid);
      if (upcoming.length > 0) {
        setReminders(upcoming);
      }
    } catch (err) {
      console.error('Failed to check reminders:', err);
    }
  };

  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWish.trim()) return;

    try {
      setError(null);
      await manifestationService.createManifestation(user.uid, newWish, deadline);
      setNewWish('');
      setShowAddModal(false);
      fetchManifestations();
    } catch (err: any) {
      setError(err.message || t('manifestation.create_failed'));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await manifestationService.updateStatus(id, 'completed');
      fetchManifestations();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await manifestationService.updateStatus(id, 'cancelled');
      fetchManifestations();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const dismissReminder = async (id: string) => {
    try {
      await manifestationService.markReminderSent(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to mark reminder as sent:', err);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(t('common.locale'), { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysRemaining = (timestamp: any) => {
    if (!timestamp) return 0;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="ma-container pt-24 pb-32 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="mb-4">{t('manifestation.title')}</h1>
        <p className="text-ink/60 font-serif italic">{t('manifestation.subtitle')}</p>
      </motion.div>

      {/* Reminders Section */}
      <AnimatePresence>
        {reminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 space-y-4"
          >
            {reminders.map(reminder => (
              <div 
                key={reminder.id}
                className="bg-fire/10 border border-fire/20 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-fire" size={20} />
                  <div>
                    <p className="text-sm font-medium text-fire">{t('manifestation.deadline_approaching')}</p>
                    <p className="text-xs text-ink/70">{t('manifestation.deadline_reminder', { title: reminder.wish_title, days: 3 })}</p>
                  </div>
                </div>
                <button 
                  onClick={() => dismissReminder(reminder.id!)}
                  className="text-ink/40 hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Manifestation Cards */}
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-ink/5 animate-pulse" />
          ))
        ) : (
          <>
            {manifestations.filter(m => m.status === 'active').map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard className="h-full p-8 flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <Star className="text-wood" size={24} />
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">{t('manifestation.deadline_label')}</p>
                        <p className="text-xs font-serif">{formatDate(m.deadline)}</p>
                      </div>
                    </div>
                    <h3 className="text-xl mb-4 leading-relaxed">{m.wish_title}</h3>
                    <div className="flex items-center gap-2 text-ink/50">
                      <Calendar size={14} />
                      <span className="text-xs">{t('manifestation.days_remaining', { days: getDaysRemaining(m.deadline) })}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleComplete(m.id!)}
                      className="flex-1 py-2 rounded-full border border-wood/30 text-wood text-xs hover:bg-wood hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      {t('manifestation.complete')}
                    </button>
                    <button 
                      onClick={() => handleCancel(m.id!)}
                      className="p-2 rounded-full border border-ink/10 text-ink/30 hover:text-fire hover:border-fire/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}

            {/* Empty Slots / Add Button */}
            {manifestations.filter(m => m.status === 'active').length < 3 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="h-full min-h-[250px] border-2 border-dashed border-ink/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-ink/30 hover:text-ink/60 hover:border-ink/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center group-hover:bg-ink/10 transition-colors">
                  <Plus size={24} />
                </div>
                <span className="text-xs uppercase tracking-[0.2em]">{t('manifestation.add_wish')}</span>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* History Section */}
      {manifestations.some(m => m.status !== 'active') && (
        <div className="mt-24">
          <h2 className="text-center mb-12 text-ink/40">{t('manifestation.history_title')}</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {manifestations.filter(m => m.status !== 'active').map(m => (
              <div key={m.id} className="flex items-center justify-between p-6 bg-white/20 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  {m.status === 'completed' ? (
                    <CheckCircle2 className="text-wood" size={20} />
                  ) : (
                    <X className="text-ink/20" size={20} />
                  )}
                  <div>
                    <p className={`text-sm ${m.status === 'completed' ? 'text-ink' : 'text-ink/40 line-through'}`}>
                      {m.wish_title}
                    </p>
                    <p className="text-[10px] text-ink/30 uppercase tracking-widest mt-1">
                      {m.status === 'completed' ? t('manifestation.completed') : t('manifestation.cancelled')} • {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-bg-washi rounded-[2.5rem] p-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-ink/30 hover:text-ink"
              >
                <X size={24} />
              </button>

              <h2 className="mb-8">{t('manifestation.declaration_title')}</h2>
              
              <form onSubmit={handleAddWish} className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-3">{t('manifestation.wish_content_label')}</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    placeholder={t('manifestation.wish_placeholder')}
                    className="w-full bg-transparent border-b border-ink/10 py-4 text-lg focus:outline-none focus:border-wood transition-colors"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-4">{t('manifestation.deadline_selection_label')}</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['1_month', '6_months', '12_months'] as ManifestationDeadlineOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDeadline(opt)}
                        className={`py-3 rounded-xl border text-xs transition-all ${
                          deadline === opt 
                            ? 'bg-ink text-white border-ink' 
                            : 'border-ink/10 text-ink/40 hover:border-ink/30'
                        }`}
                      >
                        {opt === '1_month' ? t('manifestation.1_month') : opt === '6_months' ? t('manifestation.6_months') : t('manifestation.12_months')}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-fire/10 border border-fire/20 rounded-xl flex items-center gap-3 text-fire text-xs">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <Button type="submit" className="w-full py-4">
                    {t('manifestation.declare_button')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
