import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { Sparkles, ArrowRight, Maximize2, PenLine } from 'lucide-react';
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

interface AssociationStageProps {
  pairs: CardPair[];
  onComplete: (associations: { pair_id: string; text: string }[]) => void;
  onZoom: (card: ImageCard | WordCard) => void;
}

export const AssociationStage: React.FC<AssociationStageProps> = ({ pairs, onComplete, onZoom }) => {
  const { t } = useLanguage();
  const [modes, setModes] = useState<{ [key: string]: 'guided' | 'free' }>(
    pairs.reduce((acc, _, i) => ({ ...acc, [i]: 'guided' }), {})
  );
  const [associations, setAssociations] = useState<{ [key: string]: string }>(
    pairs.reduce((acc, _, i) => ({ ...acc, [i]: '' }), {})
  );
  const [guidedValues, setGuidedValues] = useState<{ [key: string]: [string, string, string] }>(
    pairs.reduce((acc, _, i) => ({ ...acc, [i]: ['', '', ''] }), {})
  );

  const handleTextChange = (index: number, text: string) => {
    if (text.length <= 200) {
      setAssociations(prev => ({ ...prev, [index]: text }));
    }
  };

  const handleGuidedChange = (index: number, partIndex: number, value: string) => {
    if (value.length <= 50) {
      setGuidedValues(prev => {
        const newVal = [...prev[index]] as [string, string, string];
        newVal[partIndex] = value;
        return { ...prev, [index]: newVal };
      });
    }
  };

  const isComplete = Object.keys(modes).every((key) => {
    const i = parseInt(key);
    if (modes[i] === 'free') {
      return associations[i].trim().length > 0;
    } else {
      return guidedValues[i].every(v => v.trim().length > 0);
    }
  });

  const handleFinish = () => {
    const results = pairs.map((_, i) => {
      let finalPath = associations[i];
      if (modes[i] === 'guided') {
        const v = guidedValues[i];
        finalPath = `${t('test_associating_guided_1')} ${v[0]} ${t('test_associating_guided_2')} ${v[1]} ${t('test_associating_guided_3')} ${v[2]}`;
      }
      return {
        pair_id: i.toString(),
        text: finalPath
      };
    });
    onComplete(results);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl flex flex-col items-center gap-12 md:gap-10 px-4"
    >
      <div className="space-y-8 md:space-y-12 w-full">
        {pairs.map((pair, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-start bg-white/50 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-white/20"
          >
            <div className="flex gap-2 justify-center sticky top-0">
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

            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Association {i + 1}</span>
                <div className="flex bg-ink/5 rounded-full p-1 self-start md:self-auto">
                  <button
                    onClick={() => setModes(prev => ({ ...prev, [i]: 'guided' }))}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] transition-all ${modes[i] === 'guided' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}
                  >
                    <Sparkles size={10} /> {t('test_associating_mode_guided')}
                  </button>
                  <button
                    onClick={() => setModes(prev => ({ ...prev, [i]: 'free' }))}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] transition-all ${modes[i] === 'free' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted hover:text-ink'}`}
                  >
                    <PenLine size={10} /> {t('test_associating_mode_free')}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {modes[i] === 'guided' ? (
                  <motion.div
                    key="guided"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="text-left text-base md:text-lg text-ink/70 font-light leading-relaxed">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-6 md:gap-y-8">
                        <span className="whitespace-nowrap">{t('test_associating_guided_1')}</span>
                        <input
                          type="text"
                          value={guidedValues[i][0]}
                          onChange={(e) => handleGuidedChange(i, 0, e.target.value)}
                          placeholder={t('test_associating_guided_placeholder_1')}
                          className="w-full md:w-auto px-6 py-2.5 bg-emerald-50/50 hover:bg-emerald-50/80 rounded-full border border-emerald-100/20 focus:bg-white focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/5 outline-none transition-all text-ink placeholder:text-ink/20 text-left md:min-w-[180px]"
                        />
                        <span className="whitespace-nowrap">{t('test_associating_guided_2')}</span>
                        <input
                          type="text"
                          value={guidedValues[i][1]}
                          onChange={(e) => handleGuidedChange(i, 1, e.target.value)}
                          placeholder={t('test_associating_guided_placeholder_2')}
                          className="w-full md:w-auto px-6 py-2.5 bg-emerald-50/50 hover:bg-emerald-50/80 rounded-full border border-emerald-100/20 focus:bg-white focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/5 outline-none transition-all text-ink placeholder:text-ink/20 text-left md:min-w-[180px]"
                        />
                        <span className="whitespace-nowrap">{t('test_associating_guided_3')}</span>
                        <input
                          type="text"
                          value={guidedValues[i][2]}
                          onChange={(e) => handleGuidedChange(i, 2, e.target.value)}
                          placeholder={t('test_associating_guided_placeholder_3')}
                          className="w-full md:w-auto px-6 py-2.5 bg-emerald-50/50 hover:bg-emerald-50/80 rounded-full border border-emerald-100/20 focus:bg-white focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/5 outline-none transition-all text-ink placeholder:text-ink/20 text-left md:min-w-[180px]"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="free"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative"
                  >
                    <textarea
                      value={associations[i]}
                      onChange={(e) => handleTextChange(i, e.target.value)}
                      placeholder={t('test_associating_placeholder')}
                      className="w-full h-32 md:h-40 bg-white/50 border border-white/30 rounded-2xl p-4 pb-10 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all resize-none"
                    />
                    <div className="absolute bottom-4 right-4">
                      <span className={`text-[10px] ${associations[i].length >= 180 ? 'text-rose-400' : 'text-ink-muted'}`}>
                        {associations[i].length} / 200
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
