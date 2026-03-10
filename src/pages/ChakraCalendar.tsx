import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Info, 
  X, 
  Calendar as CalendarIcon,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ChakraType, CHAKRA_COLORS, CHAKRA_NAMES_ZH, CHAKRA_DESCRIPTIONS, EnergyEntry } from '../types';

export const ChakraCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<EnergyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Load entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chakra_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chakra entries", e);
      }
    }
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    localStorage.setItem('chakra_entries', JSON.stringify(entries));
  }, [entries]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Padding for the first week
    const firstDay = date.getDay();
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(formatDateKey(date));
  };

  const handleSelectChakra = (chakra: ChakraType) => {
    if (!selectedDate) return;
    
    const newEntry: EnergyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      chakra,
      timestamp: Date.now()
    };
    
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== selectedDate);
      return [...filtered, newEntry];
    });
    
    setSelectedDate(null);
  };

  const getEntryForDate = (date: Date) => {
    const key = formatDateKey(date);
    return entries.find(e => e.date === key);
  };

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.chakra] = (counts[e.chakra] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted;
  }, [entries]);

  const dominantChakra = stats[0]?.[0] as ChakraType | undefined;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32 px-4 relative overflow-hidden">
      {/* Background Aurora Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full rounded-full blur-[120px]"
          style={{ background: dominantChakra ? CHAKRA_COLORS[dominantChakra] : '#4D4DFF' }}
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.15, 0.05],
            rotate: [0, -30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full rounded-full blur-[120px]"
          style={{ background: stats[1]?.[0] ? CHAKRA_COLORS[stats[1][0] as ChakraType] : '#A64DFF' }}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.3em] text-white/60"
          >
            <Sparkles size={12} />
            <span>The Chakra Spectrum</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif tracking-widest"
          >
            內在極光儀
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-sm font-light tracking-widest"
          >
            觀測能量的流動，記錄靈魂的光譜
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 md:p-8 bg-white/[0.02] border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-serif tracking-widest">
                    {currentDate.toLocaleString('zh-TW', { year: 'numeric', month: 'long' })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-4">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="text-center text-[10px] uppercase tracking-widest text-white/30 pb-4">
                    {d}
                  </div>
                ))}
                {daysInMonth.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const entry = getEntryForDate(date);
                  const isToday = formatDateKey(new Date()) === formatDateKey(date);
                  
                  return (
                    <motion.button
                      key={date.toISOString()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDateClick(date)}
                      className={`relative aspect-square rounded-full flex items-center justify-center text-sm transition-all ${
                        isToday ? 'border border-white/20' : 'border border-transparent'
                      } ${entry ? '' : 'hover:bg-white/5'}`}
                    >
                      <span className={`relative z-10 ${entry ? 'text-white' : 'text-white/40'}`}>
                        {date.getDate()}
                      </span>
                      {entry && (
                        <motion.div 
                          layoutId={`aura-${entry.id}`}
                          className="absolute inset-0 rounded-full blur-md opacity-60"
                          style={{ background: CHAKRA_COLORS[entry.chakra] }}
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.4, 0.7, 0.4]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>

            {/* Legend / Info */}
            <div className="flex flex-wrap gap-4 justify-center">
              {Object.entries(CHAKRA_NAMES_ZH).map(([type, name]) => (
                <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHAKRA_COLORS[type as ChakraType] }} />
                  <span className="text-[10px] tracking-widest text-white/60">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar / Insights */}
          <div className="space-y-6">
            <GlassCard className="p-6 bg-white/[0.02] border-white/5 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                  <Activity size={16} />
                </div>
                <h3 className="text-sm uppercase tracking-[0.3em] text-white/80">能量洞察</h3>
              </div>

              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-40">
                  <CalendarIcon size={32} strokeWidth={1} />
                  <p className="text-xs tracking-widest leading-relaxed">
                    尚未有能量紀錄<br />點擊日期開始觀測
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {dominantChakra && (
                    <div className="space-y-4">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">主導能量</span>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-serif tracking-widest">{CHAKRA_NAMES_ZH[dominantChakra]}</span>
                          <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ background: CHAKRA_COLORS[dominantChakra] }} />
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed font-light">
                          {CHAKRA_DESCRIPTIONS[dominantChakra]}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-white/40">光譜分佈</span>
                    <div className="space-y-3">
                      {stats.map(([type, count]) => (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-[10px] tracking-widest mb-1">
                            <span className="text-white/60">{CHAKRA_NAMES_ZH[type as ChakraType]}</span>
                            <span className="text-white/40">{count} 天</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / entries.length) * 100}%` }}
                              className="h-full rounded-full"
                              style={{ background: CHAKRA_COLORS[type as ChakraType] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full h-12 text-[10px] tracking-[0.2em] border-white/10 hover:bg-white/5"
                      onClick={() => setShowInfo(true)}
                    >
                      <Info size={14} className="mr-2" /> 關於脈輪能量
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Chakra Selection Modal */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 md:p-12 overflow-hidden"
            >
              {/* Modal Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-[80px] rounded-full" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">觀測日期</span>
                    <h3 className="text-2xl font-serif tracking-widest">{selectedDate}</h3>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-white/60 font-light tracking-widest">選擇今日的主導能量：</p>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.values(ChakraType).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSelectChakra(type)}
                        className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left"
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-125 transition-transform" 
                          style={{ background: CHAKRA_COLORS[type] }} 
                        />
                        <div className="flex-1">
                          <div className="text-sm tracking-widest mb-0.5">{CHAKRA_NAMES_ZH[type]}</div>
                          <div className="text-[10px] text-white/40 font-light tracking-wider">{CHAKRA_DESCRIPTIONS[type]}</div>
                        </div>
                        <Zap size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 md:p-12 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif tracking-widest">關於脈輪能量</h3>
                <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-8">
                <p className="text-sm text-white/60 leading-relaxed font-light tracking-widest">
                  脈輪（Chakra）是源自古印度的能量系統，代表身體中七個主要的能量中心。每個脈輪都與特定的情緒、心理狀態和身體部位相關聯。
                </p>
                <div className="space-y-6">
                  {Object.values(ChakraType).map((type) => (
                    <div key={type} className="flex gap-6 items-start">
                      <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border border-white/10" style={{ background: `${CHAKRA_COLORS[type]}20` }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: CHAKRA_COLORS[type] }} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm tracking-[0.2em] font-medium">{CHAKRA_NAMES_ZH[type]}</h4>
                        <p className="text-xs text-white/40 leading-relaxed font-light tracking-wider">
                          {CHAKRA_DESCRIPTIONS[type]}。當此能量平衡時，你會感到穩定、自信且充滿愛。
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
