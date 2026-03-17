import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, Send, Sparkles, X, Globe, Languages, Heart, Eye, Navigation, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { aiService } from '../services/aiService';
import { Bottle, BottleTag } from '../core/types';
import { CastBottleModal } from '../components/ocean/CastBottleModal';
import { BottleDetailModal } from '../components/ocean/BottleDetailModal';

interface MyBottle extends Bottle {
  blessing_count: number;
  last_blessing_at: string | null;
  last_checked_at: string;
  view_count: number;
}

export const Ocean: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'explore' | 'voyage'>('explore');
  const [pickedBottle, setPickedBottle] = useState<Bottle | null>(null);
  const [myBottles, setMyBottles] = useState<MyBottle[]>([]);
  const [isFetchingMyBottles, setIsFetchingMyBottles] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [tags, setTags] = useState<BottleTag[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBlessing, setIsBlessing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  
  // Ambient Sound State
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [showAmbientPrompt, setShowAmbientPrompt] = useState(false);

  useEffect(() => {
    // Check if prompt has been seen
    const hasSeenPrompt = localStorage.getItem('oceanAmbientPromptSeen');
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => setShowAmbientPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Auto-hide prompt after 10 seconds
    if (showAmbientPrompt) {
      const timer = setTimeout(() => setShowAmbientPrompt(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showAmbientPrompt]);

  useEffect(() => {
    // Initialize ambient audio
    const audio = new Audio('https://firebasestorage.googleapis.com/v0/b/yuni-8f439.firebasestorage.app/o/eunie-assets%2Faudio%2Fwaves.MP3?alt=media&token=9b3dbc7c-6c56-447e-9c45-ac273d4fc4d4');
    audio.loop = true;
    audio.volume = 0;
    ambientAudioRef.current = audio;

    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ambientAudioRef.current) return;
    
    if (isAmbientPlaying) {
      ambientAudioRef.current.play().catch(err => console.error("Ambient play failed:", err));
      // Fade in
      let vol = 0;
      const interval = setInterval(() => {
        vol += 0.02;
        if (vol >= 0.4) {
          vol = 0.4;
          clearInterval(interval);
        }
        if (ambientAudioRef.current) ambientAudioRef.current.volume = vol;
      }, 50);
      return () => clearInterval(interval);
    } else {
      // Fade out
      let vol = ambientAudioRef.current.volume;
      const interval = setInterval(() => {
        vol -= 0.02;
        if (vol <= 0) {
          vol = 0;
          ambientAudioRef.current?.pause();
          clearInterval(interval);
        }
        if (ambientAudioRef.current) ambientAudioRef.current.volume = vol;
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isAmbientPlaying]);

  useEffect(() => {
    // Check premium status
    if (profile && profile.subscription_status !== 'active' && profile.role !== 'admin') {
      setShowPremiumModal(true);
    }

    // Fetch tags
    fetch('/api/bottles/tags')
      .then(res => res.json())
      .then(setTags)
      .catch(console.error);
  }, [profile]);

  useEffect(() => {
    if (viewMode === 'voyage' && profile) {
      fetchMyBottles();
    }
  }, [viewMode, profile]);

  const fetchMyBottles = async () => {
    if (!profile) return;
    setIsFetchingMyBottles(true);
    try {
      const res = await fetch(`/api/bottles/my/${profile.uid}`);
      if (res.ok) {
        const data = await res.json();
        setMyBottles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingMyBottles(false);
    }
  };

  const calculateDrift = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const hours = (now - created) / (1000 * 60 * 60);
    return (hours * 1.2).toFixed(1); // 1.2 nm per hour
  };

  const markAsRead = async (bottleId: string) => {
    try {
      await fetch(`/api/bottles/${bottleId}/mark-read`, { method: 'POST' });
      setMyBottles(prev => prev.map(b => 
        b.id === bottleId ? { ...b, last_checked_at: new Date().toISOString() } : b
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const pickupBottle = async () => {
    if (!profile) return;
    
    try {
      const res = await fetch(`/api/bottles/random?userId=${profile.uid}&targetLang=${language}`);
      if (res.ok) {
        const bottle = await res.json();
        setPickedBottle(bottle);
        setTranslatedContent(bottle.translatedContent || null);
      } else {
        // No bottles found or error
        alert(t('ocean.no_bottles') || 'Ocean is calm today...');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTranslate = async () => {
    if (!pickedBottle || isTranslating) return;
    
    setIsTranslating(true);
    const targetLang = language === 'ja' ? 'ja' : 'zh';
    const translation = await aiService.translateBottle(pickedBottle.content, targetLang);
    setTranslatedContent(translation);
    setIsTranslating(false);
  };

  const sendBlessing = async (tagId: string) => {
    if (!pickedBottle || !profile || isBlessing) return;
    
    setIsBlessing(true);
    try {
      const res = await fetch(`/api/bottles/${pickedBottle.id}/bless`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.uid, tagId })
      });
      
      if (res.ok) {
        setPickedBottle(null);
        // Show success animation or toast
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBlessing(false);
    }
  };

  if (showPremiumModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-washi p-6">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-soft text-center border border-ink/5">
          <div className="w-16 h-16 bg-water/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-water" />
          </div>
          <h2 className="text-2xl font-display font-bold text-ink mb-4">
            {language === 'ja' ? '共鳴の海へようこそ' : '歡迎來到共鳴之海'}
          </h2>
          <p className="text-ink/60 mb-8 leading-relaxed">
            {language === 'ja' 
              ? 'ここはプレミアム会員専用の空間です。あなたのエネルギーを世界に届け、誰かの心と共鳴しましょう。' 
              : '這裡是 Premium 會員專屬的空間。讓妳的能量在海洋中流動，與遠方的靈魂產生共鳴。'}
          </p>
          <button 
            onClick={() => onNavigate?.('profile')}
            className="w-full py-4 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-all"
          >
            {language === 'ja' ? 'プランを確認する' : '查看訂閱方案'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A192F] overflow-hidden flex flex-col items-center">
      {/* Top Navigation Toggle */}
      <div className="z-20 mt-12 mb-8 flex items-center gap-4">
        <div className="bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/10 flex items-center">
          <button
            onClick={() => setViewMode('explore')}
            className={`px-8 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all ${
              viewMode === 'explore' ? 'bg-water/20 text-white shadow-lg shadow-water/10' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {language === 'zh' ? '探索海洋' : '海を探索'}
          </button>
          <button
            onClick={() => setViewMode('voyage')}
            className={`px-8 py-2.5 rounded-full text-xs tracking-widest uppercase transition-all ${
              viewMode === 'voyage' ? 'bg-water/20 text-white shadow-lg shadow-water/10' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {language === 'zh' ? '我的航程' : '私の航海'}
          </button>
        </div>

        {/* Ambient Sound Toggle */}
        <button
          onClick={() => setIsAmbientPlaying(!isAmbientPlaying)}
          className={`p-3 rounded-full backdrop-blur-md border transition-all ${
            isAmbientPlaying 
              ? 'bg-water/20 border-water/40 text-white shadow-lg shadow-water/10' 
              : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
          }`}
          title={language === 'zh' ? '海浪聲' : '波の音'}
        >
          {isAmbientPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Deep Ocean Background with New Assets */}
      <div className="absolute inset-0 z-0">
        {/* Desktop Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="hidden md:block absolute inset-0"
        >
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/yuni-8f439.firebasestorage.app/o/eunie-assets%2Faudio%2Feunie_message_p.jpeg?alt=media&token=a4a4ef6f-f6d6-43f8-9071-2e4ba6b761aa"
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        {/* Mobile Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="block md:hidden absolute inset-0"
        >
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/yuni-8f439.firebasestorage.app/o/eunie-assets%2Faudio%2Feunie_message_m.jpeg?alt=media&token=f800adbb-1027-4513-a168-b565ff353683"
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        {/* Deep Ocean Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A192F]/60" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: "110%",
              opacity: 0 
            }}
            animate={{ 
              y: "-10%",
              opacity: [0, 0.4, 0],
            }}
            transition={{ 
              duration: 15 + Math.random() * 20, 
              repeat: Infinity,
              delay: Math.random() * 10
            }}
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>
      <div className="z-10 text-center px-6 w-full max-w-4xl flex-1 flex flex-col justify-center">
        {viewMode === 'explore' ? (
          !pickedBottle ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-8 relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-water/20 rounded-full blur-2xl"
                />
                <div className="relative z-10 w-full h-full flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <Waves className="w-10 h-10 text-water" />
                </div>
              </div>
              
              <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-widest">
                {language === 'zh' ? '共鳴之海' : '共鳴の海'}
              </h1>
              <p className="text-white/40 mb-12 max-w-xs mx-auto leading-relaxed italic">
                {language === 'ja' 
                  ? '静かな波の音に耳を澄ませて、漂うメッセージを探してみましょう。' 
                  : '靜下心來，聽聽海浪的聲音，尋找那些漂流在時光中的訊息。'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={pickupBottle}
                  className="group relative px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-water" />
                    {language === 'ja' ? 'メッセージを拾う' : '拾取共鳴'}
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-water/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>

                <button
                  onClick={() => setIsCastModalOpen(true)}
                  className="group relative px-10 py-4 bg-water/20 hover:bg-water/30 text-white rounded-full border border-water/30 transition-all overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Send className="w-5 h-5 text-white" />
                    {t('ocean_cast_btn')}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : null
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl mx-auto space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-serif italic text-white">
                {language === 'zh' ? '海洋航行日誌' : '海洋航行日誌'}
              </h2>
              <p className="text-xs text-white/40 tracking-widest uppercase">
                {language === 'zh' ? '追蹤妳投擲出的每一份能量' : 'あなたが投げ出したエネルギーを追跡する'}
              </p>
            </div>

            {isFetchingMyBottles ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-2 border-water/20 border-t-water rounded-full animate-spin" />
              </div>
            ) : myBottles.length === 0 ? (
              <div className="py-20 text-center space-y-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Navigation className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-sm text-white/40 italic">
                  {language === 'zh' ? '妳的航程尚未開始，去投擲第一封瓶中信吧。' : 'あなたの航海はまだ始まっていません。最初の瓶中信を投げに行きましょう。'}
                </p>
                <button
                  onClick={() => setViewMode('explore')}
                  className="px-8 py-3 bg-water/20 text-white border border-water/30 rounded-full hover:bg-water/30 transition-all text-sm"
                >
                  {language === 'zh' ? '前往探索海洋' : '海を探索しに行く'}
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myBottles.map((bottle) => {
                  const hasNewBlessing = bottle.last_blessing_at && new Date(bottle.last_blessing_at) > new Date(bottle.last_checked_at);
                  
                  return (
                    <motion.div
                      key={bottle.id}
                      layout
                      onClick={() => {
                        markAsRead(bottle.id);
                        setPickedBottle(bottle);
                        setTranslatedContent(bottle.translatedContent || null);
                      }}
                      className={`group relative bg-white/5 backdrop-blur-md border rounded-3xl p-6 transition-all cursor-pointer ${
                        hasNewBlessing ? 'border-water/40 shadow-[0_0_30px_rgba(51,166,184,0.2)]' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex gap-6">
                        <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                          {bottle.card_image ? (
                            <img src={bottle.card_image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Waves className="w-8 h-8 text-white/10" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] tracking-widest text-white/40 uppercase">
                              {new Date(bottle.created_at).toLocaleDateString()}
                            </p>
                            {hasNewBlessing && (
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-[10px] text-water font-bold uppercase tracking-tighter"
                              >
                                {language === 'zh' ? '✨ 收到了一份共鳴' : '✨ 共鳴を受け取りました'}
                              </motion.span>
                            )}
                          </div>

                          <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">
                            {bottle.content}
                          </p>

                          <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2 text-white/40">
                              <Waves size={12} className="text-water" />
                              <span className="text-[10px] font-mono">{calculateDrift(bottle.created_at)} nm</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/40">
                              <Eye size={12} />
                              <span className="text-[10px] font-mono">{bottle.view_count}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/40">
                              <Heart size={12} className={bottle.blessing_count > 0 ? 'text-fire' : ''} />
                              <span className="text-[10px] font-mono">{bottle.blessing_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <CastBottleModal 
        isOpen={isCastModalOpen}
        onClose={() => setIsCastModalOpen(false)}
        onNavigate={onNavigate}
      />

      <BottleDetailModal
        bottle={pickedBottle}
        onClose={() => setPickedBottle(null)}
        onTranslate={handleTranslate}
        onBless={sendBlessing}
        translatedContent={translatedContent}
        isTranslating={isTranslating}
        isBlessing={isBlessing}
        tags={tags}
      />

      {/* Ambient Sound Prompt Toast */}
      <AnimatePresence>
        {showAmbientPrompt && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: 20 }}
            className="fixed bottom-32 right-6 z-[60] flex items-center gap-4 bg-white/10 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-water/20 flex items-center justify-center text-water shrink-0">
              <Waves size={20} />
            </div>
            <div className="flex flex-col min-w-[140px]">
              <span className="text-xs text-white font-medium">聽見大海的聲音？</span>
              <button 
                onClick={() => {
                  setIsAmbientPlaying(true);
                  setShowAmbientPrompt(false);
                  localStorage.setItem('oceanAmbientPromptSeen', 'true');
                }}
                className="text-[10px] text-water hover:text-water/80 transition-colors uppercase tracking-widest font-bold mt-1 text-left"
              >
                點擊開啟環境音效
              </button>
            </div>
            <button 
              onClick={() => {
                setShowAmbientPrompt(false);
                localStorage.setItem('oceanAmbientPromptSeen', 'true');
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={14} className="text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
