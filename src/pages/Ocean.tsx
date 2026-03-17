import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, Send, Sparkles, X, Globe, Languages, Plus, Anchor, Eye, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { oceanService } from '../services/oceanService';
import { aiService } from '../services/aiService';
import { Bottle, BottleTag } from '../core/types';
import { CastBottleModal } from '../components/ocean/CastBottleModal';

type Tab = 'explore' | 'journey';

interface OceanProps {
  onNavigate?: (page: string) => void;
}

export const Ocean: React.FC<OceanProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [pickedBottle, setPickedBottle] = useState<Bottle | null>(null);
  const [myBottles, setMyBottles] = useState<any[]>([]);
  const [isFetchingMyBottles, setIsFetchingMyBottles] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [tags, setTags] = useState<BottleTag[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBlessing, setIsBlessing] = useState(false);
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const [hasReports, setHasReports] = useState<boolean | null>(null);

  useEffect(() => {
    // Check premium status
    if (profile && profile.subscription_status !== 'active' && profile.role !== 'admin' && profile.role !== 'premium_member') {
      setShowPremiumModal(true);
    }

    // Check if user has reports
    if (profile) {
      fetch(`/api/reports/${profile.uid}`)
        .then(res => res.json())
        .then(data => {
          setHasReports(Array.isArray(data.reports) && data.reports.length > 0);
        })
        .catch(() => setHasReports(false));
      
      fetchMyBottles();
    }

    // Fetch tags
    oceanService.getTags()
      .then(setTags)
      .catch(console.error);
  }, [profile]);

  const fetchMyBottles = async () => {
    if (!profile) return;
    setIsFetchingMyBottles(true);
    try {
      const data = await oceanService.getMyBottles(profile.uid);
      setMyBottles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingMyBottles(false);
    }
  };

  const pickupBottle = async () => {
    if (!profile) return;
    
    try {
      const bottle = await oceanService.pickupBottle(profile.uid, language);
      if (bottle) {
        setPickedBottle(bottle);
        setTranslatedContent(bottle.translatedContent || null);
      } else {
        // No bottles found - show a temporary message instead of alert
        setShowEmptyMessage(true);
        setTimeout(() => setShowEmptyMessage(false), 3000);
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
      await oceanService.sendBlessing(pickedBottle.id, profile.uid, tagId);
      setPickedBottle(null);
      // Show success animation or toast
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
            {t('nav_ocean')}
          </h2>
          <p className="text-ink/60 mb-8 leading-relaxed">
            {t('ocean_premium_only')}
          </p>
          <button 
            onClick={() => onNavigate ? onNavigate('profile') : window.location.href = '/profile'}
            className="w-full py-4 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-all"
          >
            {t('ocean_view_plans')}
          </button>
        </div>
      </div>
    );
  }

  if (hasReports === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A192F] p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl text-center border border-white/10">
          <div className="w-20 h-20 bg-water/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Waves className="w-10 h-10 text-water" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-6 tracking-widest">
            {t('nav_ocean')}
          </h2>
          <p className="text-white/60 mb-10 leading-relaxed italic">
            {t('ocean_error_no_reports')}
          </p>
          <button 
            onClick={() => onNavigate ? onNavigate('test') : window.location.href = '/test'}
            className="w-full py-4 bg-water/20 text-white rounded-full font-medium hover:bg-water/30 transition-all border border-water/30"
          >
            {t('home_start_btn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A192F] overflow-hidden flex flex-col items-center">
      {/* Deep Ocean Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(179,157,219,0.05)_0%,transparent_50%)]" />
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-water/10 to-transparent"
        />
      </div>

      {/* Tab Switcher */}
      <div className="z-20 mt-12 mb-8 flex bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-6 py-2 rounded-xl text-xs tracking-widest transition-all ${
            activeTab === 'explore' ? 'bg-water/20 text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          {language === 'ja' ? '海を探索' : '探索海洋'}
        </button>
        <button
          onClick={() => setActiveTab('journey')}
          className={`px-6 py-2 rounded-xl text-xs tracking-widest transition-all ${
            activeTab === 'journey' ? 'bg-water/20 text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          {language === 'ja' ? '私の航海' : '我的航程'}
        </button>
      </div>

      <div className="z-10 text-center px-6 w-full max-w-lg flex-1 flex flex-col justify-center pb-40">
        {activeTab === 'explore' ? (
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
                {t('nav_ocean')}
              </h1>
              <p className="text-white/40 mb-12 max-w-xs mx-auto leading-relaxed italic">
                {t('ocean_intro')}
              </p>

              <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                <button
                  onClick={pickupBottle}
                  className="group relative px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all overflow-hidden shadow-xl shadow-water/5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3 text-sm tracking-widest">
                    <Sparkles className="w-5 h-5 text-water" />
                    {t('ocean_pickup_btn')}
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-water/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="w-full bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative"
              >
                <button 
                  onClick={() => setPickedBottle(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>

                <div className="flex items-center gap-3 mb-8">
                  {pickedBottle.card_image_url && (
                    <div className="w-10 h-14 rounded-lg overflow-hidden border border-ink/10 shadow-sm flex-shrink-0">
                      <img src={pickedBottle.card_image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${pickedBottle.element}`} />
                      <span className="text-[10px] font-medium text-ink/40 uppercase tracking-widest">
                        {pickedBottle.nickname ? (
                          language === 'ja' 
                            ? `${pickedBottle.nickname}さん（${pickedBottle.element}）より` 
                            : `來自 ${pickedBottle.nickname}（${pickedBottle.element === 'wood' ? '木' : pickedBottle.element === 'fire' ? '火' : pickedBottle.element === 'earth' ? '土' : pickedBottle.element === 'metal' ? '金' : '水'}屬性）`
                        ) : (
                          language === 'ja' 
                            ? `${pickedBottle.element}の属性を持つ旅人より` 
                            : `來自 ${pickedBottle.element === 'wood' ? '木' : pickedBottle.element === 'fire' ? '火' : pickedBottle.element === 'earth' ? '土' : pickedBottle.element === 'metal' ? '金' : '水'}屬性的旅人`
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-ink/30">
                      <Globe className="w-3 h-3" />
                      {pickedBottle.origin_locale}
                    </div>
                  </div>
                </div>

                <div className="min-h-[150px] flex flex-col justify-center mb-10 space-y-6">
                  {pickedBottle.quote && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block opacity-60 text-left">
                        {t('ocean_reflection_title')}
                      </span>
                      <p className="text-sm md:text-base text-ink/60 leading-relaxed font-serif italic text-left">
                        {pickedBottle.quote}
                      </p>
                    </div>
                  )}

                  {pickedBottle.content && (
                    <div className="space-y-2">
                      {pickedBottle.quote && (
                        <span className="text-[10px] uppercase tracking-[0.4em] text-ink-muted block opacity-60 text-left">
                          {t('ocean_user_message_label')}
                        </span>
                      )}
                      <p className="text-lg md:text-xl text-ink/80 leading-relaxed font-serif italic text-left">
                        「{pickedBottle.content}」
                      </p>
                    </div>
                  )}
                  
                  {translatedContent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-ink/5 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2 text-[10px] text-water font-bold uppercase tracking-tighter">
                        <Languages className="w-3 h-3" />
                        Translation
                      </div>
                      <p className="text-base md:text-lg text-ink/60 leading-relaxed font-serif italic">
                        {translatedContent}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  {!translatedContent && pickedBottle.lang !== (language === 'ja' ? 'ja' : 'zh') && (
                    <button
                      onClick={handleTranslate}
                      disabled={isTranslating}
                      className="flex items-center justify-center gap-2 text-xs text-water hover:text-water/80 transition-colors font-medium"
                    >
                      {isTranslating ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Languages className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Languages className="w-4 h-4" />
                      )}
                      {t('ocean_translate_btn')}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => sendBlessing(tag.id)}
                        disabled={isBlessing}
                        className="py-2 md:py-3 px-3 md:px-4 rounded-2xl border border-ink/10 text-[10px] md:text-sm text-ink/60 hover:bg-ink hover:text-white hover:border-ink transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3 h-3" />
                        {language === 'ja' ? tag.text_ja : tag.text_zh}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full space-y-6 pb-40"
          >
            <div className="text-left mb-8">
              <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-widest">
                {language === 'ja' ? '航海の記録' : '航海日誌'}
              </h2>
              <p className="text-white/40 text-sm italic">
                {language === 'ja' ? 'あなたが流したメッセージの行方' : '記錄妳投出的每一份心意與回響'}
              </p>
            </div>

            {isFetchingMyBottles ? (
              <div className="flex justify-center py-20">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-water/20 border-t-water rounded-full"
                />
              </div>
            ) : myBottles.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/10 text-center">
                <Anchor className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-sm">
                  {language === 'ja' ? 'まだボトルを流していません' : '目前還沒有投出的瓶中信'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myBottles.map((bottle) => (
                  <motion.div
                    key={bottle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center gap-4"
                  >
                    <div className="w-12 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 overflow-hidden">
                      {bottle.card_image_url ? (
                        <img src={bottle.card_image_url} alt="" className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <Waves className="w-6 h-6 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white/80 text-sm font-serif italic truncate mb-2">
                        「{bottle.content}」
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                          <Eye className="w-3 h-3" />
                          <span>{bottle.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                          <Heart className="w-3 h-3 text-water" />
                          <span className="text-water">{bottle.bless_count || 0}</span>
                        </div>
                        <div className="text-[10px] text-white/20 ml-auto">
                          {new Date(bottle.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 100,
              opacity: 0 
            }}
            animate={{ 
              y: -100,
              opacity: [0, 0.3, 0],
              x: (Math.random() - 0.5) * 200 + (Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000))
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity,
              delay: Math.random() * 10
            }}
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>

      <AnimatePresence>
        {showEmptyMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50 px-8 py-4 bg-ink/90 backdrop-blur-xl text-white rounded-full text-xs tracking-[0.4em] uppercase shadow-2xl border border-white/10"
          >
            {t('ocean_empty')}
          </motion.div>
        )}
      </AnimatePresence>

      <CastBottleModal 
        isOpen={showCastModal} 
        onClose={() => setShowCastModal(false)}
        element={profile?.dominant_element || 'none'}
      />
    </div>
  );
};
