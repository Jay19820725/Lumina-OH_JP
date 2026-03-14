import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface ShuffleAnimationProps {
  onComplete: () => void;
}

export const ShuffleAnimation: React.FC<ShuffleAnimationProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [isStopping, setIsStopping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cardCount = 12;
  const baseRadius = 140;

  // Generate unique offsets for each card to make the motion feel organic
  const cardOffsets = useMemo(() => 
    [...Array(cardCount)].map(() => ({
      speed: 0.6 + Math.random() * 0.3,
      radiusOffset: Math.random() * 15,
      initialRotate: Math.random() * 360
    })), []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= 8) {
          clearInterval(interval);
          handleStop();
          return 8;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleStop = () => {
    setIsStopping(true);
    // The "Spread" duration
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  // Determine rotation speed based on time
  // 0-6s: slow (20s duration), 6-8s: faster (5s duration)
  const rotationDuration = elapsed < 6 ? 20 : 5;

  return (
    <div className="relative w-full h-[450px] md:h-[700px] flex flex-col items-center justify-center overflow-hidden mt-0 mb-[100px] md:my-0">
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Central Energy Core */}
        <motion.div
          animate={{
            scale: isStopping ? [1, 1.3, 0] : [1, 1.05, 1],
            opacity: isStopping ? [0.2, 0.4, 0] : [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: isStopping ? 1.2 : 6,
            repeat: isStopping ? 0 : Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-80 h-80 bg-wood/10 blur-[120px] rounded-full"
        />

        {/* Orbiting Cards Container */}
        <motion.div
          animate={!isStopping ? { rotate: 360 } : { rotate: 30, scale: 1.05 }}
          transition={{
            rotate: {
              duration: rotationDuration,
              repeat: !isStopping ? Infinity : 0,
              ease: "linear",
            },
            scale: { duration: 1 }
          }}
          className="relative w-0 h-0"
        >
          {[...Array(cardCount)].map((_, i) => {
            const angle = (i / cardCount) * Math.PI * 2;
            const offset = cardOffsets[i];
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={
                  isStopping
                    ? {
                        x: Math.cos(angle) * (baseRadius * 5),
                        y: Math.sin(angle) * (baseRadius * 5),
                        opacity: 0,
                        scale: 0.1,
                        rotate: (angle * 180) / Math.PI + 90 + 30,
                      }
                    : {
                        x: Math.cos(angle) * (baseRadius + offset.radiusOffset),
                        y: Math.sin(angle) * (baseRadius + offset.radiusOffset),
                        opacity: 1,
                        scale: 1,
                        rotate: (angle * 180) / Math.PI + 90,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: isStopping ? 15 : 30,
                  damping: isStopping ? 20 : 30,
                  delay: isStopping ? i * 0.03 : i * 0.1,
                }}
                className="absolute w-24 h-36 bg-white/5 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl -ml-12 -mt-18 flex items-center justify-center overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-12 h-12 border border-white/20 rounded-full" />
                </div>
                
                {/* Inner Glow */}
                <motion.div 
                  animate={{ opacity: [0.05, 0.15, 0.05] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute inset-0 bg-wood/5"
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Meditation Overlay - Narrative Flow */}
        <AnimatePresence mode="wait">
          {!isStopping && (
            <motion.div
              key="meditation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
            >
              <div className="space-y-12 text-center">
                <div className="h-24 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {elapsed < 3 ? (
                      <motion.h2
                        key="narrative1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 1 }}
                        className="text-lg md:text-xl font-serif text-ink tracking-[0.2em] px-6"
                      >
                        {t('test_meditation_narrative_1')}
                      </motion.h2>
                    ) : elapsed < 6 ? (
                      <motion.h2
                        key="narrative2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 1 }}
                        className="text-lg md:text-xl font-serif text-ink tracking-[0.2em] px-6"
                      >
                        {t('test_meditation_narrative_2')}
                      </motion.h2>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="relative flex items-center justify-center">
                  {/* Breathing Circle - 2 cycles of 4s */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: 1, // 2 cycles total for 8s
                      ease: "easeInOut",
                    }}
                    className="w-48 h-48 md:w-64 md:h-64 border border-ink/10 rounded-full"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="pt-8"
                >
                  <span className="text-[9px] uppercase tracking-[0.8em] text-ink/20 animate-pulse">
                    {t('test_meditation_resonance')}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
