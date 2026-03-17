import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { User, LogOut, LogIn, Shield, Settings, Crown, Sparkles, BookOpen, BarChart3, Map, Star, Activity, Languages } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { ManifestationSection } from '../components/profile/ManifestationSection';
import { UserProfile as UserProfileType } from '../core/types';
import { useLanguage } from '../i18n/LanguageContext';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { user, profile, login, logout, loading, refreshProfile, setProfile, isAdmin, isSubscribed, isPremium } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editOceanNickname, setEditOceanNickname] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile?.displayName) {
      setEditName(profile.displayName);
    }
    if (profile?.ocean_nickname) {
      setEditOceanNickname(profile.ocean_nickname);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      const updated = await userService.updateProfile(user.uid, { 
        displayName: editName,
        ocean_nickname: editOceanNickname 
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert(t('save_failed' as any) || "プロフィールの保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user || !profile) {
      console.warn("No user or profile found for upgrade");
      return;
    }
    console.log("Starting upgrade for user:", user.uid);
    setIsUpgrading(true);
    
    try {
      // Preserve admin role if already admin
      const newRole = isAdmin ? 'admin' : 'premium_member';
      
      const updatedProfile = { 
        ...profile, 
        role: newRole as any, 
        subscription_status: 'active' as const 
      };
      setProfile(updatedProfile);

      userService.updateSubscription(user.uid, 'active').catch(err => {
        console.error("Background upgrade update failed:", err);
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.error("Upgrade failed:", error);
      window.location.reload();
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="ma-container py-32 flex items-center justify-center">
        <div className="animate-pulse-soft text-ink-muted uppercase tracking-widest text-xs">{t('status_checking')}</div>
      </div>
    );
  }

  return (
    <div className="ma-container pt-12 md:pt-20 pb-48 md:pb-64 min-h-screen px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col md:flex-row items-center gap-12 md:gap-20 mb-20 md:mb-32"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/40 backdrop-blur-3xl border border-white/60 flex items-center justify-center text-ink-muted shadow-2xl shadow-ink/5 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-wood/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={48} md:size={64} strokeWidth={0.5} className="relative z-10" />
            )}
          </div>
          
          <div className="text-center md:text-left space-y-4 md:space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">{t('member_profile')}</span>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                {isEditing ? (
                  <div className="space-y-4 w-full max-w-md">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-[0.4em] text-ink-muted ml-1">{t('display_name')}</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="font-serif tracking-widest bg-white/50 border-b border-ink/20 focus:border-wood outline-none px-2 py-1 text-xl md:text-2xl w-full"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-[0.4em] text-ink-muted ml-1">{t('ocean_nickname_label')}</label>
                      <input
                        type="text"
                        value={editOceanNickname}
                        onChange={(e) => setEditOceanNickname(e.target.value)}
                        placeholder={t('ocean_nickname_placeholder')}
                        className="font-serif tracking-widest bg-white/50 border-b border-ink/20 focus:border-wood outline-none px-2 py-1 text-lg w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h1 className="font-serif tracking-widest">{profile?.displayName || user?.displayName || t('guest')}</h1>
                    {profile?.ocean_nickname && (
                      <p className="text-[10px] text-ink-muted tracking-[0.3em] italic">
                        Ocean: {profile.ocean_nickname}
                      </p>
                    )}
                  </div>
                )}
                {user && !isEditing && (
                  <button 
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-rose-50 text-rose-300 hover:text-rose-500 transition-all group relative"
                    title={t('logout')}
                  >
                    <LogOut size={18} strokeWidth={1.5} />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 backdrop-blur-md px-2 py-1 rounded border border-ink/5">{t('logout')}</span>
                  </button>
                )}
              </div>
              {profile ? (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full border ${
                    isAdmin ? 'border-fire/20 text-fire bg-fire/5' :
                    isSubscribed ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-ink/10 text-ink-muted'
                  } uppercase tracking-widest`}>
                    {isAdmin ? 'Administrator' : 
                     isSubscribed ? 'Premium Member' : 'Free Member'}
                  </span>
                </div>
              ) : user ? (
                <div className="h-4 w-24 bg-ink/5 animate-pulse rounded-full mx-auto md:mx-0" />
              ) : null}
            </div>
            <p className="text-sm md:text-lg text-ink-muted font-light tracking-widest">{user ? t('energy_resonant') : t('searching_resonance')}</p>
            {user && (
              <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em] bg-wood text-white"
                    >
                      {isSaving ? t('saving') : t('save')}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.displayName || '');
                      }} 
                      variant="outline"
                      className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em]"
                    >
                      {t('cancel')}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline" 
                    className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em]"
                  >
                    {t('edit_profile')}
                  </Button>
                )}
                {isAdmin && !isEditing && (
                  <Button 
                    onClick={() => onNavigate?.('admin')}
                    className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em] bg-fire/10 text-fire border-fire/20 hover:bg-fire hover:text-white"
                  >
                    {t('admin_panel')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassCard delay={0.2} className="space-y-6">
            <div className="flex items-center gap-3 text-ink-muted">
              <Shield size={18} />
              <h3 className="text-xs uppercase tracking-widest">{t('account_security')}</h3>
            </div>
            {!user ? (
              <>
                <p className="text-sm leading-relaxed">
                  {t('signin_prompt')}
                </p>
                <Button onClick={login} className="w-full gap-3">
                  <LogIn size={18} /> {t('signin_google')}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed">
                  {t('sync_notice')}
                </p>
                <div className="text-sm text-ink-muted py-2 border-t border-ink/5">
                  {t('email')}: {user.email}
                </div>
              </>
            )}
          </GlassCard>

          <GlassCard delay={0.4} className="space-y-6">
            <div className="flex items-center gap-3 text-ink-muted">
              <Settings size={18} />
              <h3 className="text-xs uppercase tracking-widest">{t('settings')}</h3>
            </div>
            <div className="space-y-4">
              {/* Language Switcher */}
              <div className="flex justify-between items-center text-sm py-2 border-b border-ink/5">
                <div className="flex items-center gap-2">
                  <Languages size={14} className="text-ink-muted" />
                  <span>Language / 語言</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setLanguage('zh')}
                    className={`px-3 py-1 rounded-full text-[10px] tracking-widest transition-all ${language === 'zh' ? 'bg-wood text-white' : 'bg-ink/5 text-ink-muted hover:bg-ink/10'}`}
                  >
                    繁體中文
                  </button>
                  <button 
                    onClick={() => setLanguage('ja')}
                    className={`px-3 py-1 rounded-full text-[10px] tracking-widest transition-all ${language === 'ja' ? 'bg-wood text-white' : 'bg-ink/5 text-ink-muted hover:bg-ink/10'}`}
                  >
                    日本語
                  </button>
                </div>
              </div>

              {[
                { id: 'daily_reminder', label: t('daily_reminder') },
                { id: 'dark_mode', label: t('dark_mode') },
                { id: 'newsletter', label: t('newsletter') }
              ].map((pref) => {
                const isActive = profile?.settings?.[pref.id as keyof NonNullable<UserProfileType['settings']>];
                return (
                  <div key={pref.id} className="flex justify-between items-center text-sm">
                    <span>{pref.label}</span>
                    <button 
                      onClick={async () => {
                        if (!user || !profile) return;
                        const newSettings = {
                          ...(profile.settings || { daily_reminder: false, dark_mode: false, newsletter: false }),
                          [pref.id]: !isActive
                        };
                        
                        setProfile({ ...profile, settings: newSettings });
                        
                        try {
                          await userService.updateSettings(user.uid, newSettings);
                        } catch (err) {
                          console.error("Failed to update settings:", err);
                          setProfile(profile);
                        }
                      }}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-wood/40' : 'bg-ink/5'}`}
                    >
                      <motion.div 
                        animate={{ x: isActive ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute left-1 top-1 w-3 h-3 rounded-full shadow-sm transition-colors duration-300 ${isActive ? 'bg-wood' : 'bg-ink/20'}`} 
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {user && <ManifestationSection />}

        {!profile && user ? (
          <div className="mt-12">
            <GlassCard className="p-12 flex items-center justify-center">
              <div className="animate-pulse text-[10px] tracking-[0.4em] text-ink-muted uppercase">{t('status_checking')}</div>
            </GlassCard>
          </div>
        ) : profile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            {isPremium ? (
              <GlassCard className="bg-amber-50/30 border-amber-200/50 p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start text-amber-600">
                      <Crown size={24} />
                      <h2 className="text-xl md:text-2xl font-serif tracking-widest">{t('premium_center')}</h2>
                    </div>
                    <p className="text-sm text-ink-muted max-w-md leading-relaxed">
                      {t('premium_desc')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <Button 
                      onClick={() => onNavigate?.('history')}
                      variant="outline" 
                      className="flex-col h-24 gap-2 border-amber-200 hover:bg-amber-50 text-amber-700"
                    >
                      <Activity size={20} />
                      <span className="text-[10px] tracking-widest">{t('energy_track')}</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 border-amber-200 hover:bg-amber-50 text-amber-700">
                      <Map size={20} />
                      <span className="text-[10px] tracking-widest">{t('vision_board')}</span>
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="bg-indigo-50/30 border-indigo-200/50 p-8 md:p-12 text-center space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 text-indigo-600">
                    <Sparkles size={24} />
                    <h2 className="text-xl md:text-2xl font-serif tracking-widest">{t('upgrade_title')}</h2>
                  </div>
                  <p className="text-sm text-ink-muted max-w-lg mx-auto leading-relaxed">
                    {t('upgrade_desc')}
                  </p>
                </div>
                <Button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white tracking-[0.3em] shadow-xl shadow-indigo-200"
                >
                  {isUpgrading ? t('upgrading') : t('upgrade_now')}
                </Button>
              </GlassCard>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
