import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { DrawStage } from '../../core/types';

interface DynamicSubtitleProps {
  stage: DrawStage;
}

export const DynamicSubtitle: React.FC<DynamicSubtitleProps> = ({ stage }) => {
  const { t } = useLanguage();
  
  const getKeys = (): [string, string] => {
    switch (stage) {
      case 'drawing_images': return ['test_desc_images_1', 'test_desc_images_2'];
      case 'drawing_words': return ['test_desc_words_1', 'test_desc_words_2'];
      case 'pairing': return ['test_desc_pairing_1', 'test_desc_pairing_2'];
      case 'associating': return ['test_desc_associating_1', 'test_desc_associating_2'];
      case 'revealed': return ['test_desc_revealed_1', 'test_desc_revealed_2'];
      default: return ['test_desc_ritual_1', 'test_desc_ritual_2'];
    }
  };

  const [key1, key2] = getKeys();

  return (
    <div className="flex flex-col gap-1 md:gap-2">
      <motion.span
        key={`${stage}-1`}
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={{ opacity: 0.8, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="text-[18px] md:text-[20px] font-serif tracking-[0.2em] text-ink leading-relaxed"
      >
        {t(key1 as any)}
      </motion.span>
      <motion.span
        key={`${stage}-2`}
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={{ opacity: 0.5, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
        className="text-[13px] md:text-[16px] tracking-[0.15em] text-[#468565] md:text-[#509673] font-light leading-relaxed"
      >
        {t(key2 as any)}
      </motion.span>
    </div>
  );
};
