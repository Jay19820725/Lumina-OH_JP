import React from 'react';
import { motion } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { FiveElement, EnergyReportData } from '../../core/types';
import { useLanguage } from '../../i18n/LanguageContext';

interface EnergyProfileProps {
  report: EnergyReportData;
}

export const EnergyProfile: React.FC<EnergyProfileProps> = ({ report }) => {
  const { t } = useLanguage();

  const elements = [
    { key: FiveElement.WOOD, label: t('home_element_wood'), color: 'bg-wood', hex: '#A8C97F' },
    { key: FiveElement.FIRE, label: t('home_element_fire'), color: 'bg-fire', hex: '#E95464' },
    { key: FiveElement.EARTH, label: t('home_element_earth'), color: 'bg-earth', hex: '#FFB11B' },
    { key: FiveElement.METAL, label: t('home_element_metal'), color: 'bg-metal', hex: '#F8FBF8' },
    { key: FiveElement.WATER, label: t('home_element_water'), color: 'bg-water', hex: '#33A6B8' },
  ];

  const chartData = elements.map(el => ({
    subject: el.label,
    value: report.totalScores[el.key],
    fullMark: 100,
  }));

  const translateElement = (el: string) => {
    const map: Record<string, string> = {
      wood: t('home_element_wood'),
      fire: t('home_element_fire'),
      earth: t('home_element_earth'),
      metal: t('home_element_metal'),
      water: t('home_element_water'),
      None: t('none')
    };
    return map[el] || el;
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 mb-20 md:mb-32 items-center -mt-[100px]">
      <div className="lg:col-span-7 relative">
        <div className="absolute -top-12 -left-12 text-[15vw] font-serif font-black text-ink/[0.02] pointer-events-none select-none">
          {report.balanceScore}
        </div>
        <div className="relative aspect-square w-full max-w-[450px] mx-auto">
          {/* Blurred Energy Aura */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            {elements.map((el, i) => {
              const score = report.totalScores[el.key];
              const size = 120 + score * 2;
              return (
                <motion.div
                  key={el.key}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.4 }}
                  transition={{ duration: 3, delay: i * 0.3 }}
                  className={`absolute rounded-full ${el.color} blur-[80px] md:blur-[100px]`}
                  style={{ width: size, height: size }}
                />
              );
            })}
          </div>
          
          <div className="w-full h-full z-10 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#1A1A1A" strokeOpacity={0.08} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#1A1A1A', fontSize: 10, fontWeight: 300, letterSpacing: '0.3em' }}
                />
                <Radar
                  name="Energy"
                  dataKey="value"
                  stroke="#1A1A1A"
                  strokeWidth={0.5}
                  fill="#1A1A1A"
                  fillOpacity={0.08}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-[13px] uppercase tracking-[0.4em] text-ink-muted">{t('report_balance')}</span>
            <div className="h-px flex-1 bg-ink/5" />
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-7xl font-serif font-extralight tracking-tighter">{report.balanceScore}</span>
            <span className="text-xs uppercase tracking-widest text-ink-muted">/ 100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <span className="text-[12px] uppercase tracking-[0.4em] text-ink-muted block">{t('report_dominant')}</span>
            <h3 className="text-2xl font-serif italic tracking-widest">{translateElement(report.dominantElement)}</h3>
            <p className="text-[15px] text-ink-muted leading-relaxed font-light">
              {t('report_dominant_desc').replace('{element}', translateElement(report.dominantElement))}
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-[12px] uppercase tracking-[0.4em] text-ink-muted block">{t('report_weak')}</span>
            <h3 className="text-2xl font-serif italic tracking-widest">{translateElement(report.weakElement)}</h3>
            <p className="text-[15px] text-ink-muted leading-relaxed font-light">
              {t('report_weak_desc').replace('{element}', translateElement(report.weakElement))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
