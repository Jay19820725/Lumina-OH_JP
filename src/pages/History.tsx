import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Calendar, ChevronRight, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AnalysisReport } from '../core/types';
import { useTest } from '../store/TestContext';
import { useLanguage } from '../i18n/LanguageContext';

interface HistoryProps {
  onNavigate: (page: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [hasOtherLang, setHasOtherLang] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setReport } = useTest();
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/reports/${user.uid}?lang=${language}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setReports(data.reports || []);
        setHasOtherLang(data.hasOtherLang || false);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, language]);

  const handleViewReport = (report: AnalysisReport) => {
    setReport(report);
    onNavigate('report');
  };

  const translateElement = (el: string) => {
    const map: Record<string, string> = {
      wood: '木',
      fire: '火',
      earth: '土',
      metal: '金',
      water: '水',
      None: 'なし'
    };
    return map[el] || el;
  };

  if (loading) {
    return (
      <div className="ma-container py-32 flex items-center justify-center">
        <div className="animate-pulse-soft text-ink-muted uppercase tracking-widest text-xs">記憶を呼び起こしています...</div>
      </div>
    );
  }

  return (
    <div className="ma-container py-12 md:py-20 min-h-screen px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-20 md:mb-32 space-y-6 md:space-y-10">
          <span className="text-[10px] uppercase tracking-[0.8em] text-ink-muted block">Journey Log</span>
          <h1 className="font-serif tracking-widest">診斷紀錄</h1>
          <div className="w-12 h-px bg-ink/10 mx-auto" />
          <p className="text-sm md:text-lg text-ink-muted font-light tracking-widest leading-relaxed">探索妳的能量變遷軌跡。</p>
        </header>

        {hasOtherLang && (
          <div className="mb-8 p-4 bg-ink/5 border border-ink/10 rounded-2xl flex items-center gap-4 text-ink-muted">
            <Info size={18} className="shrink-0" />
            <p className="text-xs tracking-widest leading-relaxed">
              {language === 'zh' 
                ? '妳還有其他語言的診斷記錄，切換語系即可查看。' 
                : '他の言語での診断記録もあります。言語を切り替えると表示されます。'}
            </p>
          </div>
        )}

        {!user ? (
          <div className="text-center py-20 opacity-40">
            <p className="font-serif italic text-sm md:text-base">請先登入以查看紀錄。</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <p className="font-serif italic text-sm md:text-base">尚無診斷紀錄。</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard 
                  onClick={() => handleViewReport(report)}
                  className="flex flex-col sm:flex-row items-center justify-between hover:bg-white/80 transition-colors cursor-pointer group p-6 md:p-8 gap-6 sm:gap-0"
                >
                  <div className="flex items-center gap-4 md:gap-8 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex flex-col items-center">
                      <Calendar size={14} md:size={16} className="text-ink-muted mb-1" />
                      <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-ink-muted">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="h-8 md:h-12 w-px bg-ink/5 hidden sm:block" />
                    
                    <div className="text-right sm:text-left">
                      <span className="text-[10px] uppercase tracking-widest text-ink-muted block mb-1">優位な要素</span>
                      <span className="text-lg md:text-xl font-serif capitalize">{translateElement(report.dominant_element)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-8 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-ink/5">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-widest text-ink-muted block mb-1">バランス</span>
                      <span className="text-lg md:text-xl font-serif">{report.balance_score}</span>
                    </div>
                    <ChevronRight size={18} md:size={20} className="text-ink-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
