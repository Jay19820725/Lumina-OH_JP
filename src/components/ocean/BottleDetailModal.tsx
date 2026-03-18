import React, { useState, useMemo } from 'react';
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
  translatedContent: string | null;
  isTranslating: boolean;
  isBlessing: boolean;
  tags: BottleTag[];
}

export const BottleDetailModal: React.FC<BottleDetailModalProps> = ({
  bottle,
  onClose,
  onTranslate,
  onBless,
  translatedContent,
  isTranslating,
  isBlessing,
  tags
}) => {
  const { language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[100000] flex justify-center items-start p-4 md:p-8 pt-5 md:pt-16 overflow-hidden">
      {/* Backdrop - Click to close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      {/* Lightbox Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] bg-[#FDFCF8] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Close Button - Desktop */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all hidden md:block"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {/* Left Side: Card Image (Fixed on desktop) */}
        <div className="w-full md:w-[42%] h-48 md:h-full relative bg-slate-100 flex-shrink-0">
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
            onClick={onClose}
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
                <h2 className="text-3xl font-serif italic text-slate-800 tracking-wide">
                  {cardName}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-slate-100/60">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={14} className="text-water/60" />
                  <span className="text-[10px] tracking-[0.2em] uppercase font-medium">
                    {activeBottle.origin_locale || 'Ocean'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} className="text-water/60" />
                  <span className="text-[10px] tracking-[0.2em] uppercase font-medium">
                    {travelTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
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
                <div className="italic text-slate-400 font-serif text-lg leading-relaxed border-l-2 border-water/20 pl-6 py-2">
                  「{activeBottle.quote}」
                </div>
              )}

              <div className="space-y-8">
                <p className="text-lg md:text-xl text-slate-700 leading-[2] font-serif">
                  {activeBottle.content}
                </p>

                {/* Translation Section */}
                {needsTranslation && (
                  <div className="pt-8 border-t border-slate-50">
                    {!translatedContent ? (
                      <button
                        onClick={onTranslate}
                        disabled={isTranslating}
                        className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-water transition-colors tracking-[0.2em] uppercase font-medium"
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
                        <p className="text-base md:text-lg text-slate-500 leading-[1.8] font-serif italic">
                          {translatedContent}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Blessing Section */}
            <div className="pt-12 pb-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-[1px] bg-water/20" />
                <p className="text-[10px] tracking-[0.3em] text-slate-300 uppercase font-semibold">
                  {language === 'zh' ? '送上祝福共鳴' : '祝福の共鳴を送る'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {tags.slice(0, 4).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onBless(tag.id)}
                    disabled={isBlessing}
                    className="group py-2.5 px-5 rounded-full border border-slate-200 text-[11px] text-slate-400 hover:bg-water hover:text-white hover:border-water transition-all flex items-center gap-2 uppercase tracking-[0.1em] font-medium"
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
  );
};
