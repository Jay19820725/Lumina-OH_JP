import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface CastBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContent?: string;
  element?: string;
}

export const CastBottleModal: React.FC<CastBottleModalProps> = ({ isOpen, onClose, defaultContent = '', element = 'none' }) => {
  const { t, language } = useLanguage();
  const { user, isPremium } = useAuth();
  const [content, setContent] = useState(defaultContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // isPremium is already calculated in AuthContext (isAdmin || isSubscribed)

  const handleSubmit = async () => {
    if (!user) {
      setError(t('login_required_to_cast'));
      return;
    }

    if (!isPremium) {
      setError(t('ocean_cast_error_premium'));
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          content: content.trim(),
          element: element,
          lang: language,
          originLocale: language === 'zh' ? 'Taiwan' : 'Japan',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'SENSITIVE_CONTENT') {
          throw new Error(t('ocean_cast_error_sensitive'));
        }
        throw new Error(data.error || 'Failed to cast bottle');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setContent('');
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#FDFCF8] rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif italic tracking-tight text-ink">
                    {t('ocean_cast_title')}
                  </h2>
                  <p className="text-xs text-ink-muted leading-relaxed max-w-[280px]">
                    {t('ocean_cast_desc')}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-ink/5 rounded-full transition-colors"
                >
                  <X size={20} className="text-ink/40" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Send size={24} />
                  </div>
                  <p className="text-sm font-medium text-emerald-600 tracking-widest">
                    {t('ocean_cast_success')}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value.slice(0, 100))}
                      placeholder={t('ocean_cast_placeholder')}
                      className="w-full h-40 bg-ink/[0.02] border border-ink/5 rounded-2xl p-6 text-sm text-ink placeholder:text-ink/20 focus:outline-none focus:border-ink/20 transition-colors resize-none font-sans leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] tracking-widest text-ink/20 uppercase">
                      {t('ocean_cast_limit').replace('{count}', content.length.toString())}
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl text-rose-600"
                    >
                      <AlertCircle size={16} />
                      <span className="text-xs font-medium">{error}</span>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim()}
                    className="w-full h-14 rounded-full bg-ink text-white hover:bg-ink/90 gap-3 text-xs uppercase tracking-[0.4em] font-light"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {t('ocean_cast_btn')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
