import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Sparkles } from 'lucide-react';

interface ShuffleAnimationProps {
  onComplete: () => void;
}

export const ShuffleAnimation: React.FC<ShuffleAnimationProps> = ({ onComplete }) => {
  const [isStopping, setIsStopping] = useState(false);
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

  const handleStop = () => {
    setIsStopping(true);
    // The "Spread" duration
    setTimeout(() => {
      onComplete();
    }, 800);
  };

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
              duration: 20,
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
                <Sparkles size={24} className="text-white/5 group-hover:text-white/20 transition-colors" strokeWidth={0.5} />
                
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

        {/* Ritual Text Overlay */}
        <AnimatePresence>
          {!isStopping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none"
            >
              <span className="text-[11px] uppercase tracking-[1.2em] text-ink/10 font-light">
                共鳴中
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interaction Layer */}
      <div className="absolute bottom-12 md:bottom-32 z-50">
        <AnimatePresence>
          {!isStopping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40, filter: 'blur(15px)' }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <Button
                onClick={handleStop}
                className="h-20 px-16 rounded-full bg-ink text-paper hover:bg-ink/90 transition-all group overflow-hidden relative shadow-2xl shadow-ink/10"
              >
                <motion.div 
                  className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"
                />
                <span className="relative text-[12px] uppercase tracking-[0.6em] font-extralight">
                  シャッフルを止める
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
