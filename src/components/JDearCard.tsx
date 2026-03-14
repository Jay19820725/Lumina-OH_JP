import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface JDearCardProps {
  isFlipped: boolean;
  onClick?: () => void;
  imageUrl?: string;
  text?: string;
  type: 'image' | 'word';
  disabled?: boolean;
}

export const JDearCard: React.FC<JDearCardProps> = ({
  isFlipped,
  onClick,
  imageUrl,
  text,
  type,
  disabled
}) => {
  return (
    <div 
      className={`relative aspect-[384/688] w-full perspective-1000 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={!disabled ? onClick : undefined}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          scale: !disabled ? 1 : 1
        }}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        transition={{
          duration: 0.4,
          type: 'spring',
          stiffness: 300,
          damping: 25
        }}
        className="relative w-full h-full preserve-3d"
      >
        {/* Back Face (Washi Sanctuary Design) */}
        <div className="absolute inset-0 backface-hidden z-10">
          <div className="w-full h-full bg-[#FDFCF8] rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 group overflow-hidden border border-ink/5">
            {/* Washi Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
            
            {/* Enso (Zen Circle) Pattern */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-ink/5 group-hover:text-ink/10 transition-colors duration-2000">
                <motion.path
                  d="M 80 20 A 40 40 0 1 0 85 35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 5, ease: "easeInOut" }}
                />
              </svg>
              
              {/* Vertical Japanese Title */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="vertical-text flex flex-col items-center gap-3">
                  <span className="text-xs font-serif tracking-[0.5em] text-ink/30 uppercase">JDear</span>
                  <span className="text-[10px] font-sans tracking-[0.3em] text-ink/15 uppercase">DEAR</span>
                </div>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-15">
              <div className="w-px h-10 bg-ink" />
              <span className="text-[8px] uppercase tracking-[0.8em] text-ink whitespace-nowrap">Dear Your True Self</span>
            </div>
          </div>
        </div>
 
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 z-20">
          <div className="w-full h-full bg-white rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden border border-white/40">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="JDear Card" 
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
                draggable="false"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 text-center bg-gradient-to-br from-[#FDFCF8] to-white">
                <span className="text-2xl font-serif italic text-ink leading-[2] font-extralight tracking-widest">
                  {text}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
