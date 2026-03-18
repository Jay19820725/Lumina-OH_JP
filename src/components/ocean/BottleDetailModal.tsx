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
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Determine if translation is needed (different languages)
  const needsTranslation = useMemo(() => {
    if (!bottle) return false;
    const currentLang = language === 'ja' ? 'ja' : 'zh';
    return bottle.lang !== currentLang;
  }, [bottle?.lang, language]);

  // Handle scroll to collapse image
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 50);
  };

  // Find the card data directly from LUMINA_CARDS (Direct source lookup)
  const cardData = useMemo(() => {
    if (bottle?.card_image_url) {
      return {
        imageUrl: bottle.card_image_url,
        name: bottle.card_name_saved || bottle.card_name || ''
      };
    }
    
    if (!bottle?.card_id) return null;
    
    const cardIdStr = String(bottle.card_id);
    const isWord = cardIdStr.startsWith('word_');
    const isImg = cardIdStr.startsWith('img_');
    const numericId = Number(cardIdStr.replace(/^(word_|img_)/, ''));
    
    if (isWord || isImg) {
      const card = LUMINA_CARDS.find(c => Number(c.id) === numericId);
      if (card) {
        return {
          imageUrl: isWord ? card.wordCardUrl : card.imageCardUrl,
          name: isWord ? card.textCardContent : (bottle.card_name || '')
        };
      }
    }
    
    // Legacy fallback: try report_data first, then LUMINA_CARDS default
    if (bottle.report_data?.pairs) {
      const pair = bottle.report_data.pairs.find((p: any) => 
        Number(p.word?.id) === Number(bottle.card_id)
      );
      if (pair?.word) {
        return {
          imageUrl: pair.word.imageUrl,
          name: pair.word.name || bottle.card_name
        };
      }
    }
    
    const card = LUMINA_CARDS.find(c => Number(c.id) === Number(bottle.card_id));
    if (card) {
      return {
        imageUrl: card.wordCardUrl,
        name: card.textCardContent || bottle.card_name
      };
    }
    
    return null;
  }, [bottle]);

  if (!bottle) return null;

  // Use wordCardUrl as requested by the user
  const displayImage = cardData?.imageUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=1000';
  const cardName = cardData?.name || bottle.card_name;

  return (
    <AnimatePresence>
      {bottle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-[#FDFCF8] flex flex-col overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[100001] p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          {/* Sticky Header (Metadata) - Only visible when scrolled */}
          <AnimatePresence>
            {isScrolled && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 h-16 bg-[#FDFCF8]/90 backdrop-blur-md z-[100000] border-b border-slate-100 flex items-center px-8"
              >
                <span className="text-xs font-serif italic text-slate-400">
                  {cardName}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto no-scrollbar"
            onScroll={handleScroll}
          >
            {/* Image Section - Collapsible by scroll */}
            <motion.div 
              animate={{ 
                height: isScrolled ? '15vh' : '45vh',
                opacity: isScrolled ? 0.3 : 1
              }}
              className="relative w-full overflow-hidden bg-slate-100 transition-all duration-700 ease-in-out"
            >
              <img
                src={displayImage}
                alt={cardName}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FDFCF8]/40" />
              
              {!isScrolled && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-8 left-0 right-0 text-center flex flex-col items-center gap-2"
                >
                  <h2 className="text-2xl font-serif italic text-slate-800 tracking-wide">
                    {cardName}
                  </h2>
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-slate-400"
                  >
                    <span className="text-[10px] tracking-[0.3em] uppercase">
                      {language === 'zh' ? '向下捲動閱讀' : 'スクロールして読む'}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>

            {/* Text Content Section */}
            <div className="max-w-2xl mx-auto px-8 py-12 space-y-16">
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center justify-center gap-8 py-4 border-y border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={14} />
                  <span className="text-[11px] tracking-widest uppercase">
                    {bottle.origin_locale || 'Ocean'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[11px] tracking-widest uppercase">
                    {travelTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Globe size={14} />
                  <span className="text-[11px] tracking-widest uppercase">
                    {bottle.sender_name || 'Anonymous'}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-12 min-h-[40vh]">
                {bottle.quote && (
                  <div className="text-center italic text-slate-400 font-serif text-lg leading-relaxed px-4">
                    「{bottle.quote}」
                  </div>
                )}

                <div className="space-y-8">
                  <p className="text-xl md:text-2xl text-slate-700 leading-[1.8] font-serif text-center md:text-left">
                    {bottle.content}
                  </p>

                  {/* Translation Section - Integrated below content */}
                  {needsTranslation && (
                    <div className="pt-8 border-t border-slate-50">
                      {!translatedContent ? (
                        <button
                          onClick={onTranslate}
                          disabled={isTranslating}
                          className="flex items-center gap-2 mx-auto text-[11px] text-slate-400 hover:text-slate-600 transition-colors tracking-[0.2em] uppercase font-medium"
                        >
                          {isTranslating ? (
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Languages className="w-3 h-3" />
                            </motion.div>
                          ) : (
                            <Languages className="w-3 h-3" />
                          )}
                          {language === 'ja' ? '翻訳を表示' : '顯示翻譯'}
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 text-[10px] text-slate-300 uppercase tracking-widest justify-center md:justify-start">
                            <Languages size={12} />
                            {language === 'ja' ? '翻訳' : '翻譯內容'}
                          </div>
                          <p className="text-lg text-slate-500 leading-[1.8] font-serif italic text-center md:text-left">
                            {translatedContent}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions - Blessing Tags */}
              <div className="pt-20 pb-32 space-y-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-[1px] bg-slate-200" />
                  <p className="text-[11px] tracking-[0.4em] text-slate-300 uppercase">
                    {language === 'zh' ? '送上祝福共鳴' : '祝福の共鳴を送る'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {tags.slice(0, 4).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onBless(tag.id)}
                      disabled={isBlessing}
                      className="group py-3 px-6 rounded-full border border-slate-200 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all flex items-center gap-2 uppercase tracking-[0.1em]"
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
      )}
    </AnimatePresence>
  );
};
