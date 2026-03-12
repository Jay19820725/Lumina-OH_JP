import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useTest } from '../store/TestContext';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight, Check, Maximize2 } from 'lucide-react';
import { ShuffleAnimation } from '../components/ShuffleAnimation';
import { JDearCard } from '../components/JDearCard';
import { CardZoomModal } from '../components/CardZoomModal';
import { ImageCard, WordCard, CardPair } from '../core/types';
import { useLanguage } from '../i18n/LanguageContext';

import { preloadDecks } from '../services/cardEngine';
 
 type DrawStage = 'idle' | 'shuffling' | 'drawing_images' | 'drawing_words' | 'pairing' | 'associating' | 'revealed';

// Narrative animation variants
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

const PairingStage: React.FC<PairingStageProps> = ({ images, words, onComplete, onZoom }) => {
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
      className="w-full max-w-5xl flex flex-col items-center gap-16 md:gap-24 px-4"
    >
      <div className="w-full space-y-20 md:space-y-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-ink/5" />
              <h3 className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('test_pairing_images')}</h3>
              <div className="h-px w-8 bg-ink/5" />
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

          <motion.div variants={itemVariants} className="space-y-8">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-ink/5" />
              <h3 className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('test_pairing_words')}</h3>
              <div className="h-px w-8 bg-ink/5" />
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
      </div>

      <AnimatePresence>
        {isAllPaired && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-12 z-50"
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

const AssociationStage: React.FC<{ 
  pairs: CardPair[]; 
  onComplete: (associations: { pair_id: string; text: string }[]) => void;
  onZoom: (card: ImageCard | WordCard) => void;
}> = ({ pairs, onComplete, onZoom }) => {
  const { t } = useLanguage();
  const [associations, setAssociations] = useState<{ [key: string]: string }>(
    pairs.reduce((acc, _, i) => ({ ...acc, [i]: '' }), {})
  );

  const handleTextChange = (index: number, text: string) => {
    if (text.length <= 200) {
      setAssociations(prev => ({ ...prev, [index]: text }));
    }
  };

  const isComplete = Object.values(associations).every((text: string) => text.trim().length > 0);

  const handleFinish = () => {
    const results = pairs.map((_, i) => ({
      pair_id: i.toString(),
      text: associations[i]
    }));
    onComplete(results);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl flex flex-col items-center gap-12 md:gap-20 px-4"
    >
      <div className="space-y-8 md:space-y-12 w-full">
        {pairs.map((pair, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-center bg-white/50 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-white/20"
          >
            <div className="flex gap-2 justify-center">
              <div 
                className="w-16 h-24 md:w-20 md:h-32 rounded-lg overflow-hidden shadow-md cursor-zoom-in relative group"
                onClick={() => onZoom(pair.image)}
              >
                <img src={pair.image.imageUrl} alt="" className="w-full h-full object-cover" draggable="false" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Maximize2 size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div 
                className="w-16 h-24 md:w-20 md:h-32 rounded-lg overflow-hidden shadow-md cursor-zoom-in relative group"
                onClick={() => onZoom(pair.word)}
              >
                <img src={pair.word.imageUrl} alt="" className="w-full h-full object-cover" draggable="false" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Maximize2 size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-widest text-ink-muted">Association {i + 1}</span>
                <span className={`text-[10px] ${associations[i].length >= 180 ? 'text-rose-400' : 'text-ink-muted'}`}>
                  {associations[i].length} / 200
                </span>
              </div>
              <textarea
                value={associations[i]}
                onChange={(e) => handleTextChange(i, e.target.value)}
                placeholder={t('test_associating_placeholder')}
                className="w-full h-32 md:h-40 bg-white/50 border border-white/30 rounded-2xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all resize-none"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isComplete ? 1 : 0.5 }}
      >
        <Button 
          onClick={handleFinish} 
          disabled={!isComplete}
          className="h-16 px-12 gap-3"
        >
          {t('test_associating_view_result')} <ArrowRight size={18} />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export const EnergyTest: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { selectedCards, startDraw, setPairs, setAssociations, generateReport, isDrawing, setSelectedCards } = useTest();
  const { t } = useLanguage();
  const [drawStage, setDrawStage] = useState<DrawStage>('idle');
  const [flippedImages, setFlippedImages] = useState<number[]>([]);
  const [flippedWords, setFlippedWords] = useState<number[]>([]);
  const [zoomedCard, setZoomedCard] = useState<ImageCard | WordCard | null>(null);

  // Automatic scroll to top on stage change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [drawStage]);

  useEffect(() => {
    preloadDecks();
  }, []);

  const handleStartShuffle = () => {
    setDrawStage('shuffling');
  };

  const handleShuffleComplete = useCallback(async () => {
    await startDraw();
    setDrawStage('drawing_images');
  }, [startDraw]);

  const handleFlipImage = (index: number) => {
    if (flippedImages.includes(index)) {
      setFlippedImages(prev => prev.filter(i => i !== index));
    } else if (flippedImages.length < 3) {
      setFlippedImages(prev => [...prev, index]);
    }
  };

  const handleFlipWord = (index: number) => {
    if (flippedWords.includes(index)) {
      setFlippedWords(prev => prev.filter(i => i !== index));
    } else if (flippedWords.length < 3) {
      setFlippedWords(prev => [...prev, index]);
    }
  };

  const handleContinueToWords = () => {
    const finalImages = selectedCards.images.filter((_, i) => flippedImages.includes(i));
    setSelectedCards(prev => ({ ...prev, images: finalImages }));
    setDrawStage('drawing_words');
  };

  const handleContinueToPairing = () => {
    const finalWords = selectedCards.words.filter((_, i) => flippedWords.includes(i));
    setSelectedCards(prev => ({ ...prev, words: finalWords }));
    setDrawStage('pairing');
  };

  const handlePairingComplete = (pairs: CardPair[]) => {
    setPairs(pairs);
    setDrawStage('associating');
  };

  const handleAssociationComplete = (associations: { pair_id: string; text: string }[]) => {
    setAssociations(associations);
    setDrawStage('revealed');
  };

  const handleComplete = async () => {
    await generateReport();
    onComplete();
  };

  const allImagesFlipped = flippedImages.length === 3;
  const allWordsFlipped = flippedWords.length === 3;

  return (
    <div className="ma-container pt-12 md:pt-20 pb-48 md:pb-64 min-h-screen flex flex-col items-center">
      {/* Global Loading Overlay for Generation/Saving */}
      <AnimatePresence>
        {isDrawing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-paper/60 backdrop-blur-md z-[100]"
          >
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-20 h-20">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-ink/5 border-t-ink/20 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border border-ink/5 border-b-ink/10 rounded-full"
                />
              </div>
              <div className="space-y-2 text-center">
                <span className="text-[11px] uppercase tracking-[0.8em] text-ink/40 font-light block">{t('report_weaving')}</span>
                <p className="text-[10px] text-ink/20 tracking-widest uppercase animate-pulse">Synchronizing with the universe...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-8 md:gap-20 px-4">
        <motion.div 
          key={drawStage}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 md:space-y-6 text-left"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">
              {drawStage === 'revealed' ? t('test_step_final') : 
               drawStage === 'associating' ? t('test_step_4') :
               drawStage === 'pairing' ? t('test_step_3') :
               drawStage === 'drawing_words' ? t('test_step_2') : t('test_step_1')}
            </span>
            <div className="h-px w-8 bg-ink/10" />
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-serif tracking-[0.05em] leading-[1.1] max-w-2xl">
            {drawStage === 'drawing_images' ? t('test_title_images') : 
             drawStage === 'drawing_words' ? t('test_title_words') : 
             drawStage === 'pairing' ? t('test_title_pairing') :
             drawStage === 'associating' ? t('test_title_associating') :
             drawStage === 'revealed' ? t('test_title_revealed') : t('test_title_ritual')}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-sm md:text-base text-ink-muted max-w-lg font-light leading-[1.8] tracking-wide opacity-80">
            {drawStage === 'drawing_images' ? t('test_desc_images') : 
             drawStage === 'drawing_words' ? t('test_desc_words') : 
             drawStage === 'pairing' ? t('test_desc_pairing') :
             drawStage === 'associating' ? t('test_desc_associating') :
             drawStage === 'revealed' ? t('test_desc_revealed') : 
             t('test_desc_ritual')}
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex items-center gap-10 md:gap-16"
        >
          <div className="text-center md:text-right">
            <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block mb-2 md:mb-4">{t('test_selected')}</span>
            <span className="text-3xl md:text-4xl font-serif font-extralight tracking-tighter">
              {flippedImages.length + flippedWords.length} / 6
            </span>
          </div>
          <Button 
            onClick={handleComplete} 
            disabled={drawStage !== 'revealed'}
            className="h-16 md:h-20 px-12 md:px-16 text-base md:text-lg shadow-2xl shadow-ink/5 active:scale-95 transition-transform"
          >
            {t('test_create_report')}
          </Button>
        </motion.div>
      </div>

      {/* Ritual Stage */}
      <div className="relative w-full min-h-[700px] pb-32 flex items-center justify-center perspective-1000 -translate-y-24">
        <AnimatePresence mode="wait">
          {drawStage === 'shuffling' ? (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full relative"
            >
              <ShuffleAnimation onComplete={handleShuffleComplete} />
              {isDrawing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-paper/20 backdrop-blur-sm z-[60]"
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-2 border-ink/5 border-t-ink/40 rounded-full animate-spin" />
                    <span className="text-[11px] uppercase tracking-[0.6em] text-ink/40 font-light">{t('report_weaving')}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : drawStage === 'idle' ? (
            <motion.div 
              key="deck"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(30px)' }}
              className="relative w-72 h-96 cursor-pointer group"
              onClick={handleStartShuffle}
            >
              {/* Deck Stack Effect */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: -i * 3,
                    rotate: i * 0.8,
                  }}
                  className="absolute inset-0 bg-white/40 backdrop-blur-3xl border border-white/30 rounded-[3rem] shadow-2xl shadow-ink/5"
                  style={{ zIndex: 5 - i }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
                    <Sparkles size={64} strokeWidth={0.5} />
                  </div>
                </motion.div>
              ))}
 
              {/* Interaction Layer */}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <span className="text-[11px] uppercase tracking-[0.8em] opacity-40 group-hover:opacity-100 transition-opacity duration-1000 font-light">
                  {t('test_start_ritual')}
                </span>
              </div>
            </motion.div>
          ) : drawStage === 'drawing_images' ? (
            <motion.div 
              key="draw_images"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-4xl flex flex-col items-center gap-8 md:gap-12 px-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 w-full">
                {selectedCards.images.map((card, i) => (
                  <JDearCard
                    key={card.id}
                    type="image"
                    imageUrl={card.imageUrl}
                    isFlipped={flippedImages.includes(i)}
                    onClick={() => handleFlipImage(i)}
                  />
                ))}
              </div>
              
              {allImagesFlipped && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
                >
                  <motion.div className="pointer-events-auto w-full max-w-xs md:max-w-none flex justify-center">
                    <Button 
                      variant="secondary"
                      onClick={handleContinueToWords} 
                      className="group bg-white/20 backdrop-blur-3xl border-white/30 text-ink hover:bg-white/40 h-16 md:h-24 px-8 md:px-16 text-lg md:text-xl rounded-2xl md:rounded-3xl shadow-2xl w-full md:w-auto"
                    >
                      {t('test_continue_words')}
                      <ArrowRight className="ml-2 md:ml-4 group-hover:translate-x-1 transition-transform" size={20} md:size={24} />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          ) : drawStage === 'drawing_words' ? (
            <motion.div 
              key="draw_words"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-4xl flex flex-col items-center gap-8 md:gap-12 px-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 w-full">
                {selectedCards.words.map((card, i) => (
                  <JDearCard
                    key={card.id}
                    type="word"
                    imageUrl={card.imageUrl}
                    isFlipped={flippedWords.includes(i)}
                    onClick={() => handleFlipWord(i)}
                  />
                ))}
              </div>
              
              {allWordsFlipped && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
                >
                  <motion.div className="pointer-events-auto w-full max-w-xs md:max-w-none flex justify-center">
                    <Button 
                      variant="secondary"
                      onClick={handleContinueToPairing} 
                      className="group bg-white/20 backdrop-blur-3xl border-white/30 text-ink hover:bg-white/40 h-16 md:h-24 px-8 md:px-16 text-lg md:text-xl rounded-2xl md:rounded-3xl shadow-2xl w-full md:w-auto"
                    >
                      {t('test_continue_pairing')}
                      <ArrowRight className="ml-2 md:ml-4 group-hover:translate-x-1 transition-transform" size={20} md:size={24} />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          ) : drawStage === 'pairing' ? (
            <motion.div
              key="pairing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full"
            >
              <PairingStage 
                images={selectedCards.images} 
                words={selectedCards.words} 
                onComplete={handlePairingComplete}
                onZoom={setZoomedCard}
              />
            </motion.div>
          ) : drawStage === 'associating' ? (
            <motion.div
              key="associating"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full"
            >
              <AssociationStage 
                pairs={selectedCards.pairs || []} 
                onComplete={handleAssociationComplete}
                onZoom={setZoomedCard}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="reveal"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-5xl space-y-8 md:space-y-12 px-4"
            >
              <motion.div variants={itemVariants} className="text-center space-y-2 mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-serif">{t('report_revealed_ready')}</h2>
                <p className="text-xs md:text-sm text-ink-muted">{t('test_revealed_desc')}</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {selectedCards.pairs?.map((pair, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm"
                  >
                    <div className="flex gap-2">
                      <div 
                        className="w-20 h-32 md:w-24 md:h-40 rounded-xl overflow-hidden shadow-lg cursor-zoom-in relative group"
                        onClick={() => setZoomedCard(pair.image)}
                      >
                        <img src={pair.image.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Maximize2 size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div 
                        className="w-20 h-32 md:w-24 md:h-40 rounded-xl overflow-hidden shadow-lg cursor-zoom-in relative group"
                        onClick={() => setZoomedCard(pair.word)}
                      >
                        <img src={pair.word.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Maximize2 size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-1 md:space-y-2">
                      <span className="text-[8px] uppercase tracking-widest text-ink-muted">Association</span>
                      <p className="text-xs md:text-sm font-serif italic text-ink leading-relaxed px-2 md:px-4">
                        "{pair.association}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-8 pt-12">
                <Button 
                  onClick={handleComplete}
                  className="h-16 px-16 gap-3 shadow-xl shadow-wood/10"
                >
                  {t('test_revealed_view_report')} <Sparkles size={18} />
                </Button>

                <button 
                  onClick={() => {
                    setDrawStage('idle');
                    setFlippedImages([]);
                    setFlippedWords([]);
                  }}
                  className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                >
                  {t('test_draw_again')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CardZoomModal 
        card={zoomedCard} 
        onClose={() => setZoomedCard(null)} 
      />
    </div>
  );
};
