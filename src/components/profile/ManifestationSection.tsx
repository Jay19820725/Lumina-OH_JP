import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Plus, X, Calendar, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { manifestationService } from '../../services/manifestationService';
import { useAuth } from '../../hooks/useAuth';
import { Manifestation, ManifestationDeadlineOption } from '../../core/types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

export const ManifestationSection: React.FC = () => {
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
      setError(err.message || '願望の作成に失敗しました。');
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
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysRemaining = (timestamp: any) => {
    if (!timestamp) return 0;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!user) return null;

  return (
    <div className="space-y-12 mt-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-serif tracking-widest">Manifestation</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">願望の現実化</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          variant="outline"
          className="h-10 px-4 gap-2 text-[10px] tracking-widest"
        >
          <Plus size={14} /> 新しい願望
        </Button>
      </div>

      {/* Reminders Section */}
      <AnimatePresence>
        {reminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {reminders.map(reminder => (
              <div 
                key={reminder.id}
                className="bg-fire/10 border border-fire/20 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-fire" size={20} />
                  <div>
                    <p className="text-sm font-medium text-fire">期限が近づいています</p>
                    <p className="text-xs text-ink/70">「{reminder.wish_title}」の期限まであと3日です。</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-ink/5 animate-pulse" />
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
                <GlassCard className="h-full p-6 flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <Star className="text-wood" size={20} />
                      <div className="text-right">
                        <p className="text-[8px] uppercase tracking-widest text-ink/40 mb-1">期限</p>
                        <p className="text-[10px] font-serif">{formatDate(m.deadline)}</p>
                      </div>
                    </div>
                    <h3 className="text-sm mb-3 leading-relaxed font-medium">{m.wish_title}</h3>
                    <div className="flex items-center gap-2 text-ink/50">
                      <Calendar size={12} />
                      <span className="text-[10px]">残り {getDaysRemaining(m.deadline)} 日</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleComplete(m.id!)}
                      className="flex-1 py-1.5 rounded-full border border-wood/30 text-wood text-[10px] hover:bg-wood hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={12} />
                      達成
                    </button>
                    <button 
                      onClick={() => handleCancel(m.id!)}
                      className="p-1.5 rounded-full border border-ink/10 text-ink/30 hover:text-fire hover:border-fire/30 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}

            {manifestations.filter(m => m.status === 'active').length < 3 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="h-full min-h-[180px] border-2 border-dashed border-ink/10 rounded-3xl flex flex-col items-center justify-center gap-3 text-ink/30 hover:text-ink/60 hover:border-ink/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center group-hover:bg-ink/10 transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em]">新しい願望を刻む</span>
              </motion.button>
            )}
          </>
        )}
      </div>

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

              <h2 className="mb-8 text-xl font-serif tracking-widest">願望の宣言</h2>
              
              <form onSubmit={handleAddWish} className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-3">願望の内容</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    placeholder="例：新しい創造的なプロジェクトを成功させる"
                    className="w-full bg-transparent border-b border-ink/10 py-4 text-lg focus:outline-none focus:border-wood transition-colors"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-4">期限の選択</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['1_month', '6_months', '12_months'] as ManifestationDeadlineOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDeadline(opt)}
                        className={`py-3 rounded-xl border text-[10px] transition-all ${
                          deadline === opt 
                            ? 'bg-ink text-white border-ink' 
                            : 'border-ink/10 text-ink/40 hover:border-ink/30'
                        }`}
                      >
                        {opt === '1_month' ? '1ヶ月' : opt === '6_months' ? '6ヶ月' : '1年'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-fire/10 border border-fire/20 rounded-xl flex items-center gap-3 text-fire text-[10px] tracking-widest">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <Button type="submit" className="w-full py-4 text-xs tracking-[0.2em]">
                    宇宙へ宣言する
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
