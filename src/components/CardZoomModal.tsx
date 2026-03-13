import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ImageCard, WordCard, FiveElement } from '../core/types';

interface CardZoomModalProps {
  card: ImageCard | WordCard | null;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({ card, onClose }) => {
  // Body scroll lock
  useEffect(() => {
    if (card) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [card]);

  if (!card) return null;

  const elements = [
    { key: FiveElement.WOOD, label: '木', color: 'bg-wood' },
    { key: FiveElement.FIRE, label: '火', color: 'bg-fire' },
    { key: FiveElement.EARTH, label: '土', color: 'bg-earth' },
    { key: FiveElement.METAL, label: '金', color: 'bg-metal' },
    { key: FiveElement.WATER, label: '水', color: 'bg-water' },
  ];

  return typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-ink/60 backdrop-blur-xl cursor-zoom-out"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full flex flex-col items-center gap-8 md:gap-12 cursor-default"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 md:-top-16 right-0 md:-right-16 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Card Image */}
          <div className="relative aspect-[384/688] h-[50vh] md:h-[65vh] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 bg-white">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              src={card.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            
            {/* Subtle Glow based on elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Metadata */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-6 md:space-y-8 max-w-md"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.6em] text-white/40">Soul Gaze</span>
              <p className="text-lg md:text-xl font-serif font-extralight tracking-widest text-white leading-relaxed">
                {card.description || ('text' in card ? card.text : '静かな共鳴')}
              </p>
            </div>

            <div className="flex justify-center gap-4 md:gap-6">
              {elements.map((el) => {
                const score = card.elements[el.key] || 0;
                if (score === 0) return null;
                return (
                  <div key={el.key} className="flex flex-col items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${el.color}`} />
                    <span className="text-[8px] uppercase tracking-widest text-white/40">{el.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="w-8 h-px bg-white/10 mx-auto" />
            
            <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase font-light">
              凝視を終えるには背景をクリックしてください
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;
};
