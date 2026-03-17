import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Languages, Heart, Waves, ChevronUp } from 'lucide-react';
import { Bottle, BottleTag } from '../../core/types';
import { useLanguage } from '../../i18n/LanguageContext';

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
  const { t, language } = useLanguage();
  const [showText, setShowText] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!bottle) return null;

  // Determine the best image URL to display
  const displayImage = bottle.card_image || bottle.word_text || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=1000';

  return (
    <AnimatePresence>
      {bottle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-[#0A192F] flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[100001] p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-all border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Top Section: Card Image (60%) */}
          <div className="relative h-[55vh] md:h-[60vh] w-full overflow-hidden flex-shrink-0 bg-black/20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              className="w-full h-full"
            >
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={displayImage}
                alt={bottle.card_name}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0A192F]" />

            {/* Card Info Overlay */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-12 left-8 right-8 text-center"
            >
              <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2">
                {language === 'zh' ? '共鳴牌卡' : '共鳴カード'}
              </p>
              <h2 className="text-2xl font-display font-bold text-white tracking-wider">
                {bottle.card_name || 'Energy Card'}
              </h2>
              
              {!showText && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={() => setShowText(true)}
                  className="mt-12 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors group mx-auto"
                >
                  <span className="text-[10px] tracking-[0.5em] uppercase">
                    {language === 'zh' ? '閱讀訊息' : 'メッセージを読む'}
                  </span>
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ChevronUp className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Bottom Section: Content Drawer (40% + Sliding) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: showText ? '0%' : '85%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-1 bg-[#0A192F] border-t border-white/10 rounded-t-[3rem] relative z-10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Handle */}
            <div 
              className="w-full py-6 flex justify-center cursor-pointer"
              onClick={() => setShowText(!showText)}
            >
              <div className="w-12 h-1 bg-white/10 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-32 md:pb-12 no-scrollbar">
              <div className="max-w-2xl mx-auto space-y-10">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-water">
                      <Globe size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest text-white/40 uppercase">
                        {bottle.sender_name || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-white/20 uppercase tracking-tighter">
                        {bottle.origin_locale} • {new Date(bottle.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                  {bottle.quote && (
                    <div className="space-y-3">
                      <div className="w-8 h-[1px] bg-water/40" />
                      <p className="text-lg font-serif italic text-white/70 leading-relaxed">
                        「{bottle.quote}」
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-xl text-white leading-relaxed font-light">
                      {bottle.content}
                    </p>
                  </div>
                  
                  {translatedContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-white/5 rounded-3xl border border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-3 text-[10px] text-water font-bold uppercase tracking-widest">
                        <Languages className="w-4 h-4" />
                        Translation
                      </div>
                      <p className="text-base text-white/60 leading-relaxed italic font-light">
                        {translatedContent}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-8 border-t border-white/5 space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] tracking-[0.3em] text-white/20 uppercase">
                      {language === 'zh' ? '送上祝福共鳴' : '祝福の共鳴を送る'}
                    </p>
                    
                    {!translatedContent && bottle.lang !== (language === 'ja' ? 'ja' : 'zh') && (
                      <button
                        onClick={onTranslate}
                        disabled={isTranslating}
                        className="flex items-center gap-2 text-[10px] text-water hover:text-water/80 transition-colors font-bold uppercase tracking-widest"
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
                        {language === 'ja' ? '翻訳する' : '翻譯訊息'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {tags.slice(0, 4).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => onBless(tag.id)}
                        disabled={isBlessing}
                        className="group py-4 px-6 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
                      >
                        <Heart size={12} className="group-hover:scale-125 transition-transform" />
                        {language === 'ja' ? tag.text_ja : tag.text_zh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
