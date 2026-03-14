import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTest } from '../store/TestContext';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight, Maximize2, RefreshCw } from 'lucide-react';
import { ShuffleAnimation } from '../components/ShuffleAnimation';
import { EunieCard } from '../components/EunieCard';
import { CardZoomModal } from '../components/CardZoomModal';
import { useLanguage } from '../i18n/LanguageContext';
import { preloadDecks } from '../services/cardEngine';
import { PairingStage } from '../components/test/PairingStage';
import { AssociationStage } from '../components/test/AssociationStage';
import { DynamicSubtitle } from '../components/test/DynamicSubtitle';
import { useEnergyTestState } from '../hooks/useEnergyTestState';

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

export const EnergyTest: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useLanguage();
  const {
    drawStage,
    setDrawStage,
    flippedImages,
    flippedWords,
    zoomedCard,
    setZoomedCard,
    isGenerating,
    loadingTime,
    isDrawing,
    selectedCards,
    handleStartShuffle,
    handleShuffleComplete,
    handleFlipImage,
    handleFlipWord,
    handleContinueToWords,
    handleContinueToPairing,
    handlePairingComplete,
    handleAssociationComplete,
    handleComplete,
    handleRedrawImages,
    handleRedrawWords,
    hasRedrawnImages,
    hasRedrawnWords,
    isReshuffling,
    allImagesFlipped,
    allWordsFlipped,
  } = useEnergyTestState(onComplete);

  useEffect(() => {
    preloadDecks();
  }, []);

  return (
    <div className="ma-container pt-8 md:pt-16 pb-40 md:pb-80 min-h-screen flex flex-col items-center">
      {/* Global Loading Overlay for Generation/Saving */}
      <AnimatePresence>
        {(isDrawing || isGenerating || isReshuffling) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              backgroundColor: isReshuffling ? ['rgba(245,245,244,0)', 'rgba(245,245,244,0.8)'] : 'rgba(245,245,244,0.8)'
            }}
            transition={{ 
              backgroundColor: { delay: 0.5, duration: 0.5 }
            }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center backdrop-blur-xl z-[100]"
          >
            <div className="flex flex-col items-center gap-10">
              <div className="relative w-24 h-24">
                {/* Outer Ring */}
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.05, 1],
                    borderColor: ['rgba(20,20,20,0.05)', 'rgba(20,20,20,0.15)', 'rgba(20,20,20,0.05)']
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    borderColor: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute inset-0 border-[0.5px] rounded-full"
                />
                
                {/* Middle Spinning Ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-2 border-ink/5 border-t-ink/20 rounded-full"
                />
                
                {/* Inner Counter-Spinning Ring */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-6 border border-ink/5 border-b-ink/10 rounded-full"
                />

                {/* Center Pulse */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={isReshuffling ? { 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.2, 0.5, 0.2]
                  } : { opacity: 1 }}
                  transition={isReshuffling ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 } : {}}
                  className="absolute inset-10 bg-ink/5 rounded-full blur-xl"
                />
              </div>

              <div className="space-y-4 text-center max-w-[280px] md:max-w-xs">
                {isReshuffling ? (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-[13px] md:text-sm tracking-[0.2em] text-ink/70 font-serif block italic animate-pulse"
                  >
                    {t('test_resensing_energy')}
                  </motion.span>
                ) : isGenerating ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={loadingTime < 3 ? 's1' : loadingTime < 6 ? 's2' : 's3'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[13px] md:text-sm tracking-[0.2em] text-ink/70 font-serif block italic min-h-[1.5em]"
                      >
                        {loadingTime < 3 ? t('report_loading_stage_1') : 
                         loadingTime < 6 ? t('report_loading_stage_2') : 
                         t('report_loading_stage_3')}
                      </motion.span>
                    </AnimatePresence>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-[10px] text-ink/30 tracking-[0.3em] uppercase leading-relaxed font-light"
                    >
                      {t('report_loading_subtitle')}
                    </motion.p>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] uppercase tracking-[0.8em] text-ink/40 font-light block">{t('report_weaving')}</span>
                    <p className="text-[10px] text-ink/20 tracking-widest uppercase animate-pulse">Synchronizing with the universe...</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-6 gap-8 md:gap-20 px-4 h-[220.766px] md:h-auto">
        <motion.div 
          key={drawStage}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 md:space-y-6 text-left"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <span className="text-[10px] md:text-[12px] uppercase tracking-[0.6em] text-ink-muted">
              {drawStage === 'revealed' ? t('test_step_final') : 
               drawStage === 'associating' ? t('test_step_4') :
               drawStage === 'pairing' ? t('test_step_3') :
               drawStage === 'drawing_words' ? t('test_step_2') : t('test_step_1')}
            </span>
            <div className="h-px w-8 bg-ink/10" />
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-[60px] lg:text-7xl font-serif tracking-[0.05em] leading-[1.1] max-w-2xl">
            {drawStage === 'drawing_images' ? t('test_title_images') : 
             drawStage === 'drawing_words' ? t('test_title_words') : 
             drawStage === 'pairing' ? t('test_title_pairing') :
             drawStage === 'associating' ? t('test_title_associating') :
             drawStage === 'revealed' ? t('test_title_revealed') : t('test_title_ritual')}
          </motion.h1>
          
          <motion.div variants={itemVariants} className="max-w-lg">
            <DynamicSubtitle stage={drawStage} />
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex items-center gap-10 md:gap-16"
        >
          <div className="text-center md:text-right mt-[-15px] md:mt-0">
            <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block mb-2 md:mb-4">{t('test_selected')}</span>
            <span className="text-3xl md:text-4xl font-serif font-extralight tracking-tighter">
              {flippedImages.length + flippedWords.length} / 6
            </span>
          </div>
        </motion.div>
      </div>

      {/* Ritual Stage */}
      <div className="relative w-full min-h-[380px] md:min-h-[900px] pb-10 md:pb-[250px] flex items-center justify-center perspective-1000 mt-0 md:mt-0">
        <AnimatePresence mode="wait">
          {drawStage === 'shuffling' ? (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full relative flex flex-col items-center"
            >
              <ShuffleAnimation onComplete={handleShuffleComplete} />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-center"
              >
                <span className="text-[10px] uppercase tracking-[0.6em] text-ink/40 animate-pulse">
                  {t('test_shuffling_text')}
                </span>
              </motion.div>
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
              <motion.div 
                animate={isReshuffling ? { scale: 0.8, opacity: 0, filter: 'blur(10px)' } : { scale: 1, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 w-full"
              >
                {selectedCards.images.map((card, i) => (
                  <EunieCard
                    key={card.id}
                    type="image"
                    imageUrl={card.imageUrl}
                    isFlipped={flippedImages.includes(i)}
                    onClick={() => handleFlipImage(i)}
                  />
                ))}
              </motion.div>
              
              {allImagesFlipped && !isReshuffling && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pointer-events-auto w-full max-w-xs md:max-w-md flex flex-col items-center gap-6"
                  >
                    <Button 
                      variant="secondary"
                      onClick={handleContinueToWords} 
                      className="group bg-white/90 backdrop-blur-3xl border-white/80 text-ink hover:bg-white h-16 md:h-24 px-8 md:px-16 text-lg md:text-xl rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full"
                    >
                      {t('test_continue_words')}
                      <ArrowRight className="ml-2 md:ml-4 group-hover:translate-x-1 transition-transform" size={20} />
                    </Button>

                    {!hasRedrawnImages && (
                      <Button
                        variant="outline"
                        onClick={handleRedrawImages}
                        className="h-12 px-8 bg-white/60 backdrop-blur-xl border-white/50 text-ink hover:text-ink hover:border-white/80 rounded-xl shadow-xl"
                      >
                        <RefreshCw size={14} className="mr-2" />
                        {t('test_redraw_images')}
                      </Button>
                    )}
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
              <motion.div 
                animate={isReshuffling ? { scale: 0.8, opacity: 0, filter: 'blur(10px)' } : { scale: 1, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 w-full"
              >
                {selectedCards.words.map((card, i) => (
                  <EunieCard
                    key={card.id}
                    type="word"
                    imageUrl={card.imageUrl}
                    isFlipped={flippedWords.includes(i)}
                    onClick={() => handleFlipWord(i)}
                  />
                ))}
              </motion.div>
              
              {allWordsFlipped && !isReshuffling && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pointer-events-auto w-full max-w-xs md:max-w-md flex flex-col items-center gap-6"
                  >
                    <Button 
                      variant="secondary"
                      onClick={handleContinueToPairing} 
                      className="group bg-white/90 backdrop-blur-3xl border-white/80 text-ink hover:bg-white h-16 md:h-24 px-8 md:px-16 text-lg md:text-xl rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full"
                    >
                      {t('test_continue_pairing')}
                      <ArrowRight className="ml-2 md:ml-4 group-hover:translate-x-1 transition-transform" size={20} />
                    </Button>

                    {!hasRedrawnWords && (
                      <Button
                        variant="outline"
                        onClick={handleRedrawWords}
                        className="h-12 px-8 bg-white/60 backdrop-blur-xl border-white/50 text-ink hover:text-ink hover:border-white/80 rounded-xl shadow-xl"
                      >
                        <RefreshCw size={14} className="mr-2" />
                        {t('test_redraw_words')}
                      </Button>
                    )}
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
              className="w-full max-w-5xl space-y-8 md:space-y-6 px-4"
            >
              <motion.div variants={itemVariants} className="text-center space-y-2 mb-8 md:mb-6">
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
