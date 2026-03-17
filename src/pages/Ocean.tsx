import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, Send, Sparkles, X, Globe, Languages } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { aiService } from '../services/aiService';
import { Bottle, BottleTag } from '../core/types';

export const Ocean: React.FC = () => {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [pickedBottle, setPickedBottle] = useState<Bottle | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [tags, setTags] = useState<BottleTag[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBlessing, setIsBlessing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
            onClick={() => window.location.href = '/profile'}
            className="w-full py-4 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-all"
          >
            {language === 'ja' ? 'プランを確認する' : '查看訂閱方案'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A192F] overflow-hidden flex flex-col items-center justify-center">
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

      <div className="z-10 text-center px-6">
        {!pickedBottle ? (
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
              {language === 'ja' ? '共鳴の海' : '共鳴之海'}
            </h1>
            <p className="text-white/40 mb-12 max-w-xs mx-auto leading-relaxed italic">
              {language === 'ja' 
                ? '静かな波の音に耳を澄ませて、漂うメッセージを探してみましょう。' 
                : '靜下心來，聽聽海浪的聲音，尋找那些漂流在時光中的訊息。'}
            </p>

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
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="max-w-lg w-full bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl relative"
            >
              <button 
                onClick={() => setPickedBottle(null)}
                className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-ink/40" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className={`w-3 h-3 rounded-full bg-${pickedBottle.element}`} />
                <span className="text-xs font-medium text-ink/40 uppercase tracking-widest">
                  {language === 'ja' 
                    ? `${pickedBottle.element}の属性を持つ旅人より` 
                    : `來自 ${pickedBottle.element === 'wood' ? '木' : pickedBottle.element === 'fire' ? '火' : pickedBottle.element === 'earth' ? '土' : pickedBottle.element === 'metal' ? '金' : '水'}屬性的旅人`}
                </span>
                <div className="flex items-center gap-1 ml-auto text-[10px] text-ink/30">
                  <Globe className="w-3 h-3" />
                  {pickedBottle.origin_locale}
                </div>
              </div>

              <div className="min-h-[150px] flex flex-col justify-center mb-10">
                <p className="text-xl text-ink/80 leading-relaxed font-serif italic text-left">
                  「{pickedBottle.content}」
                </p>
                
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
                    <p className="text-lg text-ink/60 leading-relaxed font-serif italic">
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
                    {language === 'ja' ? '翻訳する' : '翻譯訊息'}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => sendBlessing(tag.id)}
                      disabled={isBlessing}
                      className="py-3 px-4 rounded-2xl border border-ink/10 text-sm text-ink/60 hover:bg-ink hover:text-white hover:border-ink transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3 h-3" />
                      {language === 'ja' ? tag.text_ja : tag.text_zh}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 100,
              opacity: 0 
            }}
            animate={{ 
              y: -100,
              opacity: [0, 0.3, 0],
              x: (Math.random() - 0.5) * 200 + (Math.random() * window.innerWidth)
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
    </div>
  );
};
