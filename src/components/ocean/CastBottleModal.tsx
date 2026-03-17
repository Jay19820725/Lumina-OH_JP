import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { oceanService } from '../../services/oceanService';
import { Button } from '../ui/Button';

interface CastBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuote?: string;
  cardImages?: string[];
  element?: string;
}

export const CastBottleModal: React.FC<CastBottleModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultQuote = '', 
  cardImages = [],
  element = 'none' 
}) => {
  const { t, language } = useLanguage();
  const { user, isPremium, profile } = useAuth();
  const [quote, setQuote] = useState(defaultQuote);
  const [userMessage, setUserMessage] = useState('');
  const [selectedCardUrl, setSelectedCardUrl] = useState<string | null>(cardImages[0] || null);
  const [nickname, setNickname] = useState(profile?.ocean_nickname || profile?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuote(defaultQuote);
      setUserMessage('');
      setSelectedCardUrl(cardImages[0] || null);
      setNickname(profile?.ocean_nickname || profile?.displayName || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, defaultQuote, profile, cardImages]);

  const handleSubmit = async () => {
    if (!user) {
      setError(t('login_required_to_cast'));
      return;
    }

    if (!isPremium) {
      setError(t('ocean_cast_error_premium'));
      return;
    }

    if (!quote.trim() && !userMessage.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await oceanService.castBottle({
        user_id: user?.uid,
        content: userMessage.trim(),
        quote: quote.trim(),
        card_image_url: selectedCardUrl,
        element: element,
        nickname: nickname.trim(),
        lang: language,
        origin_locale: language === 'zh' ? 'Taiwan' : 'Japan',
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setQuote('');
        setUserMessage('');
      }, 2000);
    } catch (err) {
      if ((err as Error).message === 'CONTENT_SENSITIVE') {
        setError(t('ocean_cast_error_sensitive'));
      } else {
        setError((err as Error).message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#FDFCF8] rounded-[2.5rem] shadow-2xl overflow-hidden my-auto"
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
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-ink-muted ml-2">
                      {t('ocean_nickname_label') || '暱稱 / Nickname'}
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                      placeholder={t('ocean_nickname_placeholder') || '妳的稱呼...'}
                      className="w-full h-12 bg-ink/[0.02] border border-ink/5 rounded-xl px-6 text-sm text-ink placeholder:text-ink/20 focus:outline-none focus:border-ink/20 transition-colors font-sans"
                    />
                  </div>

                  {cardImages.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-ink-muted ml-2">
                        {t('ocean_select_card_label')}
                      </label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2">
                        {cardImages.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedCardUrl(url)}
                            className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedCardUrl === url ? 'border-ink scale-105 shadow-md' : 'border-transparent opacity-50'
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-ink-muted ml-2">
                        {t('ocean_reflection_title')}
                      </label>
                      <textarea
                        value={quote}
                        onChange={(e) => setQuote(e.target.value.slice(0, 200))}
                        placeholder={t('ocean_reflection_title')}
                        className="w-full h-24 bg-ink/[0.02] border border-ink/5 rounded-2xl p-4 text-xs text-ink/60 italic placeholder:text-ink/20 focus:outline-none focus:border-ink/20 transition-colors resize-none font-serif leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-ink-muted ml-2">
                        {t('ocean_user_message_label')}
                      </label>
                      <div className="relative">
                        <textarea
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value.slice(0, 200))}
                          placeholder={t('ocean_cast_placeholder')}
                          className="w-full h-32 bg-ink/[0.02] border border-ink/5 rounded-2xl p-6 text-sm text-ink placeholder:text-ink/20 focus:outline-none focus:border-ink/20 transition-colors resize-none font-sans leading-relaxed"
                        />
                        <div className="absolute bottom-4 right-4 text-[10px] tracking-widest text-ink/20 uppercase">
                          {t('ocean_cast_limit').replace('{count}', userMessage.length.toString())}
                        </div>
                      </div>
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
                    disabled={isSubmitting || (!quote.trim() && !userMessage.trim())}
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

  return createPortal(modalContent, document.body);
};
