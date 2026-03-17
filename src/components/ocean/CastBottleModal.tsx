import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { AnalysisReport, CardPair } from '../../core/types';

interface CastBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
  initialReport?: AnalysisReport | null;
}

type Step = 'check' | 'select_report' | 'select_card' | 'write';

export const CastBottleModal: React.FC<CastBottleModalProps> = ({ isOpen, onClose, onNavigate, initialReport }) => {
  const { t, language } = useLanguage();
  const { user, isPremium } = useAuth();
  const [step, setStep] = useState<Step>('check');
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ id: string; type: 'img' | 'word'; url?: string; text?: string; name: string } | null>(null);
  const [content, setContent] = useState('');
  const [quote, setQuote] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Body scroll lock and scroll to top
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      if (initialReport) {
        setSelectedReport(initialReport);
        setStep('write');
        const langKey = language === 'ja' ? 'ja-JP' : 'zh-TW';
        const initialQuote = initialReport.multilingualContent?.[langKey]?.reflection || initialReport.reflection || '';
        setQuote(initialQuote);
        
        // Auto-select first card if available
        const cards = getReportCards(initialReport);
        if (cards.length > 0) setSelectedCard(cards[0]);
      } else {
        fetchReports();
      }

      if (user.default_bottle_nickname) {
        setNickname(user.default_bottle_nickname);
      } else if (user.displayName) {
        setNickname(user.displayName);
      }
    }
  }, [isOpen, user, initialReport]);

  const fetchReports = async () => {
    if (!user) return;
    setIsLoadingReports(true);
    try {
      const response = await fetch(`/api/reports/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        const reportsList = data.reports || [];
        setReports(reportsList);
        if (reportsList.length === 0) {
          setStep('check');
        } else {
          setStep('select_report');
        }
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedReport || !selectedCard) return;

    if (!isPremium) {
      setError(t('ocean_cast_error_premium'));
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          content: content.trim(),
          element: selectedReport.dominantElement || 'none',
          lang: language,
          originLocale: language === 'zh' ? 'Taiwan' : 'Japan',
          cardId: selectedCard.id,
          quote: quote.trim(),
          reportId: selectedReport.id,
          nickname: nickname.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'SENSITIVE_CONTENT') {
          throw new Error(t('ocean_cast_error_sensitive'));
        }
        throw new Error(data.error || 'Failed to cast bottle');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state
        setSuccess(false);
        setStep(initialReport ? 'write' : 'select_report');
        if (!initialReport) setSelectedReport(null);
        setSelectedCard(null);
        setContent('');
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReportCards = (report: AnalysisReport) => {
    const cards: { id: string; type: 'img' | 'word'; url?: string; text?: string; name: string }[] = [];
    if (report.pairs) {
      report.pairs.forEach((pair: CardPair) => {
        cards.push({
          id: pair.image.id,
          type: 'img',
          url: pair.image.imageUrl,
          name: pair.image.name
        });
        cards.push({
          id: pair.word.id,
          type: 'word',
          url: pair.word.imageUrl, // Use imageUrl for word cards too
          text: pair.word.text,
          name: pair.word.name
        });
      });
    }
    return cards;
  };

  const renderStepContent = () => {
    if (isLoadingReports) {
      return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-ink/10 border-t-ink rounded-full animate-spin" />
          <p className="text-xs text-ink/40 tracking-widest uppercase">{t('loading')}</p>
        </div>
      );
    }

    if (step === 'check' && reports.length === 0) {
      return (
        <div className="py-12 text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-ink/[0.02] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} className="text-ink/20" />
            </div>
            <p className="text-sm text-ink-muted leading-relaxed max-w-[240px] mx-auto">
              {t('ocean_cast_error_no_reports')}
            </p>
          </div>
          <Button
            onClick={() => onNavigate?.('test')}
            className="w-full h-14 rounded-full bg-ink text-white hover:bg-ink/90 text-xs uppercase tracking-[0.4em] font-light"
          >
            {t('ocean_go_to_test')}
          </Button>
        </div>
      );
    }

    if (step === 'select_report') {
      return (
        <div className="space-y-6">
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  setSelectedReport(report);
                  const langKey = language === 'ja' ? 'ja-JP' : 'zh-TW';
                  setQuote(report.multilingualContent?.[langKey]?.reflection || report.reflection || '');
                  const cards = getReportCards(report);
                  if (cards.length > 0) setSelectedCard(cards[0]);
                  setStep('write');
                }}
                className="w-full p-6 bg-white border border-ink/5 rounded-2xl flex items-center justify-between hover:border-ink/20 hover:bg-ink/[0.01] transition-all group text-left"
              >
                <div className="space-y-1">
                  <p className="text-[10px] tracking-widest text-ink/40 uppercase">
                    {new Date(report.timestamp).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'ja-JP')}
                  </p>
                  <p className="text-sm font-medium text-ink group-hover:text-ink transition-colors">
                    {report.todayTheme || t('none')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-ink/20 group-hover:text-ink/40 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (step === 'write' && selectedReport) {
      const cards = getReportCards(selectedReport);

      return (
        <div className="space-y-8">
          {/* Nickname */}
          <div className="space-y-2">
            <label className="text-[12px] tracking-widest text-ink/40 uppercase px-1">
              {language === 'zh' ? '海洋暱稱' : '海洋のニックネーム'}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder={language === 'zh' ? '妳在海洋中的稱呼...' : '海でのあなたの呼び名...'}
              className="w-full h-14 bg-ink/[0.02] border border-ink/5 rounded-2xl px-6 text-sm text-ink focus:outline-none focus:border-ink/10 transition-colors"
            />
          </div>

          {/* Card Selection */}
          <div className="space-y-3">
            <label className="text-[12px] tracking-widest text-ink/40 uppercase px-1">
              {language === 'zh' ? '選擇封面牌卡' : 'カバーカードを選択'}
            </label>
            <div className="relative group">
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x">
                {cards.map((card, idx) => (
                  <button
                    key={`${card.id}-${idx}`}
                    onClick={() => setSelectedCard(card)}
                    className={`relative flex-shrink-0 w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all snap-start ${
                      selectedCard?.id === card.id ? 'border-ink scale-105 z-10' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={card.url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <label className="text-[12px] tracking-widest text-ink/40 uppercase px-1">
              {language === 'zh' ? '能量共鳴語錄' : 'エネルギー共鳴語録'}
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full h-28 bg-ink/[0.02] border border-ink/5 rounded-2xl p-6 text-sm text-ink/60 italic font-serif leading-relaxed focus:outline-none focus:border-ink/10 transition-colors resize-none"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[12px] tracking-widest text-ink/40 uppercase px-1">
              {language === 'zh' ? '妳的留言' : 'あなたのメッセージ'}
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 200))}
                placeholder={language === 'zh' ? '寫下妳想分享的訊息...' : '共有したいメッセージを書いてください...'}
                className="w-full h-36 bg-ink/[0.02] border border-ink/5 rounded-2xl p-6 text-sm text-ink placeholder:text-ink/20 focus:outline-none focus:border-ink/10 transition-colors resize-none font-sans leading-relaxed"
              />
              <div className="absolute bottom-4 right-6 text-[10px] tracking-widest text-ink/20 uppercase">
                {language === 'zh' ? `字數限制：${content.length}/200` : `文字数制限：${content.length}/200`}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || !nickname.trim()}
            className="w-full h-16 rounded-full bg-ink text-white hover:bg-ink/90 gap-3 text-xs uppercase tracking-[0.4em] font-light shadow-xl shadow-ink/10"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {language === 'zh' ? '寫成瓶中信' : '瓶中信にする'}
          </Button>

          {!initialReport && (
            <button
              onClick={() => setStep('select_report')}
              className="w-full text-[10px] tracking-widest text-ink/30 uppercase hover:text-ink transition-colors"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const getStepTitle = () => {
    if (success) return '';
    if (step === 'write') return language === 'zh' ? '寫成瓶中信' : '瓶中信にする';
    if (step === 'select_report') return t('ocean_step_select_report');
    return t('ocean_cast_title');
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-md"
          />

          <motion.div
            ref={scrollContainerRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-[#FDFCF8] rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="p-8 md:p-12 space-y-8 pb-[120px]">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <h2 className="text-3xl font-serif italic tracking-tight text-ink">
                    {getStepTitle()}
                  </h2>
                  {step === 'write' && (
                    <p className="text-sm text-ink/40 leading-relaxed">
                      {language === 'zh' 
                        ? '將妳此刻的感悟或祝福化作文字，讓它在瓶中信之海中尋找有緣的靈魂。' 
                        : '今のあなたの気づきや祝福を言葉にして、瓶中信の海で縁のある魂を探しましょう。'}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-ink/5 rounded-full transition-colors"
                >
                  <X size={24} className="text-ink/40" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>
                  <p className="text-sm font-medium text-emerald-600 tracking-widest uppercase">
                    {t('ocean_cast_success')}
                  </p>
                </motion.div>
              ) : (
                <>
                  {renderStepContent()}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl text-rose-600 mt-6"
                    >
                      <AlertCircle size={16} />
                      <span className="text-xs font-medium">{error}</span>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
