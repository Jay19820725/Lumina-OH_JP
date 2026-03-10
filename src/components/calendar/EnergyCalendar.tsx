import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EnergyJournalEntry, EmotionTag } from '../../core/types';

interface EnergyCalendarProps {
  entries: EnergyJournalEntry[];
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
}

const EMOTION_COLORS: Record<EmotionTag, string> = {
  'calm': 'bg-emerald-400',
  'anxious': 'bg-rose-400',
  'inspired': 'bg-indigo-400',
  'tired': 'bg-amber-400',
};

export const EnergyCalendar: React.FC<EnergyCalendarProps> = ({ entries, onSelectDate, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days = React.useMemo(() => {
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const result = [];

    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      result.push({ day: null, date: null });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const entry = entries.find(e => {
        const entryDate = e.date?.toDate ? e.date.toDate() : (e.created_at?.toDate ? e.created_at.toDate() : new Date(e.date));
        return entryDate.getFullYear() === year && 
               entryDate.getMonth() === month && 
               entryDate.getDate() === i;
      });
      result.push({ day: i, date, entry });
    }

    return result;
  }, [year, month, entries]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(year, month + offset, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && 
           date.getMonth() === today.getMonth() && 
           date.getDate() === today.getDate();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getFullYear() === selectedDate.getFullYear() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getDate() === selectedDate.getDate();
  };

  return (
    <div className="w-full bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[32px] p-6 md:p-10 shadow-2xl shadow-ink/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted">Energy Calendar</span>
          <h3 className="font-serif text-xl tracking-widest">
            {year}年 {month + 1}月
          </h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-full hover:bg-white/50 transition-colors text-ink-muted"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 rounded-full hover:bg-white/50 transition-colors text-ink-muted"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div key={d} className={`text-center text-[10px] uppercase tracking-widest font-medium ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-indigo-400' : 'text-ink-muted'}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {days.map((d, i) => (
          <div key={i} className="aspect-square relative">
            {d.day && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => d.date && onSelectDate?.(d.date)}
                className={`w-full h-full rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all duration-500 relative group overflow-hidden ${
                  isSelected(d.date!) 
                    ? 'bg-ink text-white shadow-lg' 
                    : isToday(d.date!)
                      ? 'bg-white/80 border border-ink/10 text-ink'
                      : 'bg-white/20 hover:bg-white/60 text-ink-muted'
                }`}
              >
                <span className={`text-xs md:text-sm font-serif ${isSelected(d.date!) ? 'opacity-100' : 'opacity-60'}`}>
                  {d.day}
                </span>
                
                {d.entry && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute bottom-2 md:bottom-3 w-1.5 h-1.5 rounded-full ${EMOTION_COLORS[d.entry.emotion_tag] || 'bg-ink/20'} shadow-[0_0_8px_currentColor]`}
                  />
                )}

                {/* Glow effect for entries */}
                {d.entry && !isSelected(d.date!) && (
                  <div className={`absolute inset-0 opacity-10 blur-md pointer-events-none ${EMOTION_COLORS[d.entry.emotion_tag]}`} />
                )}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
        {Object.entries({
          'calm': '穏やか',
          'anxious': '不安',
          'inspired': 'インスピレーション',
          'tired': 'お疲れ'
        }).map(([tag, label]) => (
          <div key={tag} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${EMOTION_COLORS[tag as EmotionTag]}`} />
            <span className="text-[10px] tracking-widest text-ink-muted uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
