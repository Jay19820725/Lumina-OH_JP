import React from 'react';
import { motion } from 'motion/react';
import { OHCardData } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OHCardProps {
  card: OHCardData;
  type: 'image' | 'word';
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const OHCard: React.FC<OHCardProps> = ({ card, type, selected, onClick, disabled }) => {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05, y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative cursor-pointer transition-all duration-500 rounded-2xl overflow-hidden shadow-lg",
        "w-48 h-72 flex flex-col items-center justify-center p-4",
        selected ? "ring-4 ring-white/50 scale-105 z-10" : "opacity-80 grayscale-[0.2]",
        disabled && !selected && "opacity-40 grayscale pointer-events-none"
      )}
      style={{ backgroundColor: card.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 pointer-events-none" />
      
      {type === 'image' ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
          <div className="text-4xl opacity-80">✨</div>
          <p className="text-sm font-serif italic text-black/70 px-2 leading-relaxed">
            {card.desc}
          </p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <h3 className="text-4xl font-serif font-bold tracking-[0.2em] text-black/80">
            {card.name}
          </h3>
        </div>
      )}

      {selected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-2 bg-white/80 rounded-full p-1"
        >
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};
