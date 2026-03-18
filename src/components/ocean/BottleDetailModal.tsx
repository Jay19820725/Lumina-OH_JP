import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Languages, Heart, Clock, MapPin } from 'lucide-react';
import { Bottle, BottleTag } from '../../core/types';
import { useLanguage } from '../../i18n/LanguageContext';
import { LUMINA_CARDS } from '../../core/cards';

interface BottleDetailModalProps {
  bottle: Bottle | null;
  onClose: () => void;
  onTranslate: () => void;
  onBless: (tagId: string) => void;
  onSave?: (bottleId: string, reply: string) => void;
  translatedContent: string | null;
  isTranslating: boolean;
  isBlessing: boolean;
  tags: BottleTag[];
  isSaved?: boolean;
  isOwnBottle?: boolean;
}

export const BottleDetailModal: React.FC<BottleDetailModalProps> = ({
  bottle,
  onClose,
  onTranslate,
  onBless,
  onSave,
  translatedContent,
  isTranslating,
  isBlessing,
  tags,
  isSaved = false,
  isOwnBottle = false
}) => {
  const { language, t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Calculate travel time
  const travelTime = useMemo(() => {
    if (!bottle) return '';
    const start = new Date(bottle.created_at).getTime();
    const now = Date.now();
    const diff = now - start;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (language === 'zh') {
      return `${days} 天 ${hours} 小時`;
    } else {
      return `${days}d ${hours}h`;
    }
  }, [bottle?.created_at, language]);

  // Determine if translation is needed
  const needsTranslation = useMemo(() => {
    if (!bottle) return false;
    const currentLang = language === 'ja' ? 'ja' : 'zh';
    return bottle.lang !== currentLang;
  }, [bottle?.lang, language]);

  // Use a "sticky" bottle to allow exit animations to show content
  const [displayBottle, setDisplayBottle] = React.useState<Bottle | null>(null);
  
  React.useEffect(() => {
    if (bottle) {
      setDisplayBottle(bottle);
    }
  }, [bottle]);

  // Find the card data directly from LUMINA_CARDS (Direct source lookup)
  const cardData = useMemo(() => {
    const target = bottle || displayBottle;
    if (!target) return null;

    if (target.card_image_url) {
      return {
        imageUrl: target.card_image_url,
        name: target.card_name_saved || target.card_name || ''
      };
    }
    
    if (!target.card_id) return null;
    
    const cardIdStr = String(target.card_id);
    const isWord = cardIdStr.startsWith('word_');
    const isImg = cardIdStr.startsWith('img_');
    const numericId = Number(cardIdStr.replace(/^(word_|img_)/, ''));
    
    if (isWord || isImg) {
      const card = LUMINA_CARDS.find(c => Number(c.id) === numericId);
      if (card) {
        return {
          imageUrl: isWord ? card.wordCardUrl : card.imageCardUrl,
          name: isWord ? card.textCardContent : (target.card_name || '')
        };
      }
    }
    
    if (target.report_data?.pairs) {
      const pair = target.report_data.pairs.find((p: any) => 
        Number(p.word?.id) === Number(target.card_id)
      );
      if (pair?.word) {
        return {
          imageUrl: pair.word.imageUrl,
          name: pair.word.name || target.card_name
        };
      }
    }
    
    const card = LUMINA_CARDS.find(c => Number(c.id) === Number(target.card_id));
    if (card) {
      return {
        imageUrl: card.wordCardUrl,
        name: card.textCardContent || target.card_name
      };
    }
    
    return null;
  }, [bottle, displayBottle]);

  const activeBottle = bottle || displayBottle;
  if (!activeBottle) return null;

  const displayImage = cardData?.imageUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=1000';
  const cardName = cardData?.name || activeBottle.card_name;

  const handleCloseAttempt = () => {
    if (!isOwnBottle && !isSaved && bottle && onSave) {
      setShowSaveConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (onSave && activeBottle) {
      onSave(activeBottle.id, replyMessage);
    }
    setShowSaveConfirm(false);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {bottle && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start p-4 md:p-8 pt-5 md:pt-16 overflow-hidden">
          {/* Backdrop - Click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseAttempt}
            className="absolute inset-0 bg-ink/40 backdrop-blur-md"
          />

          {/* Lightbox Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] bg-[#FDFCF8] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Close Button - Desktop */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-6 right-6 z-50 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all hidden md:block"
            >
              <X className="w-5 h-5 text-ink/40" />
            </button>

            {/* Left Side: Card Image (Fixed on desktop) */}
            <div className="w-full md:w-[42%] h-48 md:h-full relative bg-ink/[0.02] flex-shrink-0">
              <img
                src={displayImage}
                alt={cardName}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FDFCF8]/20 md:to-transparent" />
              
              {/* Card Name Overlay (Mobile only) */}
              <div className="absolute bottom-4 left-6 md:hidden">
                <h2 className="text-white text-lg font-serif italic drop-shadow-md">
                  {cardName}
                </h2>
              </div>

              {/* Close Button - Mobile */}
              <button
                onClick={handleCloseAttempt}
                className="absolute top-4 right-4 z-50 p-2 bg-white/20 backdrop-blur-md rounded-full md:hidden"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Right Side: Content (Scrollable) */}
            <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-[#FDFCF8]">
              <div className="px-8 md:px-12 py-10 md:py-16 space-y-12">
                {/* Header Info */}
                <div className="space-y-6">
                  <div className="hidden md:block">
                    <h2 className="text-3xl font-serif italic text-ink tracking-wide">
                      {cardName}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 py-4 border-y border-ink/[0.05]">
                    <div className="flex items-center gap-2 text-ink/40">
                      <MapPin size={14} className="text-water/60" />
                      <span className="text-[10px] tracking-[0.2em] uppercase font-medium">
                        {activeBottle.origin_locale || 'Ocean'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-ink/40">
                      <Clock size={14} className="text-water/60" />
                      <span className="text-[10px] tracking-[0.2em] uppercase font-medium">
                        {travelTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-ink/40">
                      <Globe size={14} className="text-water/60" />
                      <span className="text-[10px] tracking-[0.2em] uppercase font-medium">
                        {activeBottle.sender_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-10">
                  {activeBottle.quote && (
                    <div className="italic text-ink/40 font-serif text-lg leading-relaxed border-l-2 border-water/20 pl-6 py-2">
                      「{activeBottle.quote}」
                    </div>
                  )}

                  <div className="space-y-8">
                    <p className="text-lg md:text-xl text-ink/80 leading-[2] font-serif">
                      {activeBottle.content}
                    </p>

                    {/* Translation Section */}
                    {needsTranslation && (
                      <div className="pt-8 border-t border-ink/[0.02]">
                        {!translatedContent ? (
                          <button
                            onClick={onTranslate}
                            disabled={isTranslating}
                            className="flex items-center gap-2 text-[11px] text-ink/40 hover:text-water transition-colors tracking-[0.2em] uppercase font-medium"
                          >
                            <Languages className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                            {language === 'ja' ? '翻訳を表示' : '顯示翻譯'}
                          </button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 bg-water/5 p-6 rounded-2xl"
                          >
                            <div className="flex items-center gap-2 text-[10px] text-water/60 uppercase tracking-widest">
                              <Languages size={12} />
                              {language === 'ja' ? '翻訳' : '翻譯內容'}
                            </div>
                            <p className="text-base md:text-lg text-ink/50 leading-[1.8] font-serif italic">
                              {translatedContent}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Reply Section (New) */}
                    {!isOwnBottle && !isSaved && (
                      <div className="pt-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] tracking-[0.2em] text-ink/30 uppercase font-semibold">
                            {t('ocean_reply_label')}
                          </label>
                          <span className={`text-[10px] ${replyMessage.length > 90 ? 'text-red-400' : 'text-ink/20'}`}>
                            {replyMessage.length}/100
                          </span>
                        </div>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value.slice(0, 100))}
                          placeholder={t('ocean_reply_placeholder')}
                          className="w-full bg-white/50 border border-ink/5 rounded-2xl p-4 text-sm text-ink/70 focus:outline-none focus:border-water/30 transition-colors min-h-[100px] resize-none font-serif"
                        />
                      </div>
                    )}

                    {/* Display Saved Reply (New) */}
                    {isSaved && activeBottle.reply_message && (
                      <div className="pt-8 space-y-4">
                        <label className="text-[10px] tracking-[0.2em] text-water/60 uppercase font-semibold">
                          {t('ocean_saved_reply_label')}
                        </label>
                        <div className="bg-water/5 p-6 rounded-2xl border border-water/10">
                          <p className="text-base text-ink/60 leading-relaxed font-serif italic">
                            「{activeBottle.reply_message}」
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Blessing Section */}
                <div className="pt-12 pb-8 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-water/20" />
                    <p className="text-[10px] tracking-[0.3em] text-ink/30 uppercase font-semibold">
                      {language === 'zh' ? '送上祝福共鳴' : '祝福の共鳴を送る'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {tags.slice(0, 4).map((tag, index) => (
                      <button
                        key={tag.id || index}
                        onClick={() => onBless(tag.id)}
                        disabled={isBlessing}
                        className="group py-2.5 px-5 rounded-full border border-ink/10 text-[11px] text-ink/40 hover:bg-water hover:text-white hover:border-water transition-all flex items-center gap-2 uppercase tracking-[0.1em] font-medium"
                      >
                        <Heart size={12} className="group-hover:scale-110 transition-transform" />
                        {language === 'ja' ? tag.text_ja : tag.text_zh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Save Confirmation Modal (New) */}
      <AnimatePresence>
        {showSaveConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveConfirm(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-[#FDFCF8] p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-8"
            >
              <div className="w-16 h-16 bg-water/10 rounded-full flex items-center justify-center mx-auto text-water">
                <Heart size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-serif italic text-ink">
                  {t('ocean_save_confirm_title')}
                </h3>
                <p className="text-sm text-ink/40 leading-relaxed">
                  {t('ocean_save_confirm_desc')}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  className="w-full py-4 bg-water text-white rounded-full text-xs tracking-[0.2em] font-bold uppercase hover:bg-water/90 transition-colors"
                >
                  {t('ocean_save_confirm_btn')}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-ink/5 text-ink/40 rounded-full text-xs tracking-[0.2em] font-bold uppercase hover:bg-ink/10 transition-colors"
                >
                  {t('ocean_save_close_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
