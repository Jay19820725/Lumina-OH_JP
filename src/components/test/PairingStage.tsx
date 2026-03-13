import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { ArrowRight, Check, Maximize2 } from 'lucide-react';
import { ImageCard, WordCard, CardPair } from '../../core/types';
import { useLanguage } from '../../i18n/LanguageContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

interface PairingStageProps {
  images: ImageCard[];
  words: WordCard[];
  onComplete: (pairs: CardPair[]) => void;
  onZoom: (card: ImageCard | WordCard) => void;
}

export const PairingStage: React.FC<PairingStageProps> = ({ images, words, onComplete, onZoom }) => {
  const { t } = useLanguage();
  const [pairs, setPairs] = useState<{ imageId: string; wordId: string }[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  const handleCardClick = (cardId: string, type: 'image' | 'word') => {
    if (type === 'image') {
      if (pairs.some(p => p.imageId === cardId)) return;
      setSelectedImageId(prev => prev === cardId ? null : cardId);
    } else {
      if (pairs.some(p => p.wordId === cardId)) return;
      setSelectedWordId(prev => prev === cardId ? null : cardId);
    }
  };

  useEffect(() => {
    if (selectedImageId && selectedWordId) {
      const newPair = { imageId: selectedImageId, wordId: selectedWordId };
      setPairs(prev => [...prev, newPair]);
      setSelectedImageId(null);
      setSelectedWordId(null);
    }
  }, [selectedImageId, selectedWordId]);

  const handleUnpair = (imageId: string) => {
    setPairs(prev => prev.filter(p => p.imageId !== imageId));
  };

  const isAllPaired = pairs.length === images.length && images.length > 0;

  const handleFinish = () => {
    const finalPairs: CardPair[] = pairs.map(p => ({
      image: images.find(img => img.id === p.imageId)!,
      word: words.find(w => w.id === p.wordId)!
    }));
    onComplete(finalPairs);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl flex flex-col items-center gap-10 md:gap-16 px-4"
    >
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-32 items-start">
        {/* Images Section */}
        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted whitespace-nowrap">{t('test_pairing_images')}</span>
            <div className="h-px flex-1 bg-ink/5" />
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {images.map((card) => {
              const isPaired = pairs.some(p => p.imageId === card.id);
              const isSelected = selectedImageId === card.id;
              return (
                <motion.div
                  key={card.id}
                  onClick={() => handleCardClick(card.id, 'image')}
                  className={`relative aspect-[384/688] cursor-pointer transition-all duration-700 group ${
                    isPaired ? 'opacity-20 scale-90 pointer-events-none' : ''
                  }`}
                  animate={{
                    scale: isSelected ? 1.08 : 1,
                    y: isSelected ? -12 : 0,
                  }}
                  whileHover={{ scale: isPaired ? 0.9 : 1.05 }}
                >
                  <div className={`w-full h-full rounded-3xl overflow-hidden bg-white shadow-2xl border-2 transition-all duration-500 ${
                    isSelected ? 'border-emerald-400/50 shadow-emerald-900/10' : 'border-white/20'
                  }`}>
                    <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                    {!isPaired && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoom(card);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/40 flex items-center justify-center text-ink/40 hover:text-ink hover:bg-white/60 transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Maximize2 size={14} />
                      </button>
                    )}
                  </div>
                  {isSelected && (
                    <motion.div 
                      layoutId="glow-img"
                      className="absolute inset-0 bg-emerald-400/10 blur-2xl -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Energy Bridge Hint - Mobile: Vertical spacer */}
        <div className="lg:hidden flex items-center gap-4 w-full py-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink/10 to-ink/20" />
          <motion.div 
            key={selectedImageId || selectedWordId || 'idle-mobile'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-[0.3em] text-[#468565] uppercase whitespace-nowrap font-light"
          >
            {selectedImageId && !selectedWordId ? t('test_pairing_hint_selecting_word') :
             selectedWordId && !selectedImageId ? t('test_pairing_hint_selecting_image') :
             t('test_pairing_hint_idle')}
          </motion.div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-ink/10 to-ink/20" />
        </div>

        {/* Words Section */}
        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted whitespace-nowrap">{t('test_pairing_words')}</span>
            <div className="h-px flex-1 bg-ink/5" />
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {words.map((card) => {
              const isPaired = pairs.some(p => p.wordId === card.id);
              const isSelected = selectedWordId === card.id;
              return (
                <motion.div
                  key={card.id}
                  onClick={() => handleCardClick(card.id, 'word')}
                  className={`relative aspect-[384/688] cursor-pointer transition-all duration-700 group ${
                    isPaired ? 'opacity-20 scale-90 pointer-events-none' : ''
                  }`}
                  animate={{
                    scale: isSelected ? 1.08 : 1,
                    y: isSelected ? -12 : 0,
                  }}
                  whileHover={{ scale: isPaired ? 0.9 : 1.05 }}
                >
                  <div className={`w-full h-full rounded-3xl overflow-hidden bg-white shadow-2xl border-2 transition-all duration-500 ${
                    isSelected ? 'border-emerald-400/50 shadow-emerald-900/10' : 'border-white/20'
                  }`}>
                    <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                    {!isPaired && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoom(card);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/40 flex items-center justify-center text-ink/40 hover:text-ink hover:bg-white/60 transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Maximize2 size={14} />
                      </button>
                    )}
                  </div>
                  {isSelected && (
                    <motion.div 
                      layoutId="glow-word"
                      className="absolute inset-0 bg-emerald-400/10 blur-2xl -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Desktop Bridge Hint */}
      <div className="hidden lg:flex items-center gap-8 w-full max-w-2xl my-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink/10 to-ink/20" />
        <motion.div 
          key={selectedImageId || selectedWordId || 'idle-desktop'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs tracking-[0.4em] text-[#509673] uppercase whitespace-nowrap font-light"
        >
          {selectedImageId && !selectedWordId ? t('test_pairing_hint_selecting_word') :
           selectedWordId && !selectedImageId ? t('test_pairing_hint_selecting_image') :
           t('test_pairing_hint_idle')}
        </motion.div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-ink/10 to-ink/20" />
      </div>

      {/* Connected Pairs Section */}
      <motion.div variants={itemVariants} className="w-full space-y-12">
        <div className="flex items-center justify-center gap-6">
          <div className="h-px flex-1 bg-ink/5" />
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted whitespace-nowrap">{t('test_pairing_connected')}</span>
          <div className="h-px flex-1 bg-ink/5" />
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12 min-h-[160px]">
          <AnimatePresence mode="popLayout">
            {pairs.map((pair) => (
              <motion.div
                key={pair.imageId}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="group relative flex items-center bg-white/40 backdrop-blur-xl p-3 rounded-[2rem] border border-white/40 shadow-xl"
              >
                <div className="flex -space-x-4">
                  <div className="w-16 h-28 md:w-20 md:h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white transform -rotate-3">
                    <img src={images.find(img => img.id === pair.imageId)?.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-16 h-28 md:w-20 md:h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white transform rotate-3">
                    <img src={words.find(w => w.id === pair.wordId)?.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <button 
                  onClick={() => handleUnpair(pair.imageId)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-rose-50 text-rose-400"
                >
                  <Check size={14} className="hidden group-hover:block" />
                  <span className="group-hover:hidden">×</span>
                </button>
              </motion.div>
            ))}
            {pairs.length === 0 && (
              <div className="w-full flex items-center justify-center py-12">
                <span className="text-xs tracking-[0.4em] text-ink-muted opacity-30 italic">
                  {t('searching_resonance')}
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {isAllPaired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 md:mt-10 mb-8"
          >
            <Button onClick={handleFinish} className="h-20 px-16 gap-4 text-lg shadow-2xl shadow-emerald-900/20 bg-emerald-500 hover:bg-emerald-600">
              {t('test_pairing_confirm')} <ArrowRight size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
