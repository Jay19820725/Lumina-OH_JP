import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GestureGuideProps {
  isVisible: boolean;
}

export const GestureGuide: React.FC<GestureGuideProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-ink/[0.02]"
        >
          <div className="relative w-full max-w-sm h-64">
            {/* Hand Icon Animation */}
            <motion.div
              className="absolute"
              animate={{
                x: [-100, -100, 100, 100, -100],
                y: [0, 0, 0, 0, 0],
                scale: [1, 0.8, 1, 0.8, 1],
                opacity: [0, 1, 1, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                times: [0, 0.1, 0.5, 0.6, 1],
                ease: "easeInOut"
              }}
            >
              <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full border border-white/60 flex items-center justify-center shadow-xl">
                <div className="w-8 h-8 bg-wood/20 rounded-full animate-ping" />
                <div className="absolute w-4 h-4 bg-wood rounded-full" />
              </div>
            </motion.div>

            {/* Visual Cues for targets */}
            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-16 h-24 border-2 border-dashed border-wood/20 rounded-xl" />
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-16 h-24 border-2 border-dashed border-wood/20 rounded-xl" />
            
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-wood/30 to-transparent"
              animate={{ width: [0, 200, 0] }}
              transition={{ duration: 4, repeat: Infinity, times: [0.1, 0.5, 0.9] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
