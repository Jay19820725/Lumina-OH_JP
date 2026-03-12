import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HomeProps {
  onStartTest: () => void;
}

const EnergyOrb = ({ color, delay, initialPos }: { color: string; delay: number; initialPos: { x: string; y: string } }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, left: initialPos.x, top: initialPos.y }}
    animate={{ 
      opacity: [0.2, 0.4, 0.2],
      scale: [1, 1.1, 1],
      x: [0, 30, 0],
      y: [0, -30, 0],
    }}
    transition={{ 
      duration: 15 + delay, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay: delay 
    }}
    className="absolute w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full blur-[60px] md:blur-[120px]"
    style={{ 
      backgroundColor: color,
      willChange: 'transform, opacity',
      transform: 'translateZ(0)'
    }}
  />
);

const EnergyField = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <EnergyOrb color="var(--color-wood)" delay={0} initialPos={{ x: '10%', y: '20%' }} />
    <EnergyOrb color="var(--color-fire)" delay={2} initialPos={{ x: '60%', y: '10%' }} />
    <EnergyOrb color="var(--color-earth)" delay={4} initialPos={{ x: '40%', y: '50%' }} />
    <EnergyOrb color="var(--color-metal)" delay={1} initialPos={{ x: '70%', y: '70%' }} />
    <EnergyOrb color="var(--color-water)" delay={3} initialPos={{ x: '15%', y: '65%' }} />
    
    {/* Washi Texture Overlay */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
  </div>
);

const InkBleedText = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, filter: 'blur(10px)', letterSpacing: '0.5em' }}
    animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '0.1em' }}
    transition={{ duration: 2.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Home: React.FC<HomeProps> = ({ onStartTest }) => {
  const { t, language } = useLanguage();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <EnergyField />

      <div className="ma-container relative z-10 flex flex-col items-center text-center">
        {/* Vertical Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 1.5 }}
          className="absolute -right-4 md:-right-12 top-0 vertical-text hidden lg:flex items-center gap-6"
        >
          <span className="font-serif text-[10px] tracking-[1em] text-ink/30 uppercase">
            {t('home_subtitle')}
          </span>
          <div className="w-px h-32 bg-ink/10" />
        </motion.div>

        {/* Hero Content */}
        <div className="space-y-12 md:space-y-20">
          <div className="space-y-6">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.5, duration: 2 }}
              className="text-[10px] md:text-xs tracking-[0.6em] uppercase text-ink-muted block"
            >
              {language === 'zh' ? 'EUNIE 嶼妳 — 懂妳的能量，平衡妳的生活' : 'EUNIE — あなたの魂と共に居なさい'}
            </motion.span>
            
            <InkBleedText className="text-4xl md:text-7xl font-serif font-extralight text-ink leading-tight whitespace-pre-line">
              {t('home_hero_title')}
            </InkBleedText>
            
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 1.5, ease: "circOut" }}
              className="w-24 h-px bg-ink/10 mx-auto"
            />
          </div>

          <InkBleedText delay={1.2} className="max-w-xl mx-auto">
            <p className="text-base md:text-xl text-ink/60 font-shippori leading-[2.2] tracking-widest">
              {t('home_hero_desc')}
            </p>
          </InkBleedText>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 1.5 }}
            className="flex flex-col items-center gap-12"
          >
            <Button 
              onClick={onStartTest}
              className="group relative overflow-hidden h-16 md:h-20 px-12 md:px-20 text-sm md:text-base tracking-[0.3em]"
            >
              <span className="relative z-10 flex items-center gap-3">
                {t('home_start_btn')}
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
              </span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-wood/10 via-fire/10 to-water/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </Button>

            <div className="flex gap-10 md:gap-20">
              {[
                { label: t('home_element_wood'), color: 'bg-wood', shadow: 'shadow-wood/20' },
                { label: t('home_element_fire'), color: 'bg-fire', shadow: 'shadow-fire/20' },
                { label: t('home_element_earth'), color: 'bg-earth', shadow: 'shadow-earth/20' },
                { label: t('home_element_metal'), color: 'bg-metal', shadow: 'shadow-metal/20' },
                { label: t('home_element_water'), color: 'bg-water', shadow: 'shadow-water/20' }
              ].map((el, i) => (
                <motion.div
                  key={el.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.4, y: 0 }}
                  whileHover={{ opacity: 1, y: -2 }}
                  transition={{ 
                    opacity: { delay: 3 + (i * 0.15), duration: 2 },
                    y: { delay: 3 + (i * 0.15), duration: 2 },
                    default: { duration: 0.5, ease: "easeOut" }
                  }}
                  className="flex flex-col items-center gap-4 group cursor-default"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${el.color} ${el.shadow} shadow-[0_0_8px_currentColor] transition-all duration-500 group-hover:scale-125`} />
                  <span className="text-[10px] tracking-[0.4em] text-ink/40 font-serif transition-colors duration-500 group-hover:text-ink/80">{el.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Breathing Hint */}
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.5em] text-ink/20 uppercase pointer-events-none"
      >
        Deep Breath • {t('home_breath')}
      </motion.div>
    </div>
  );
};
