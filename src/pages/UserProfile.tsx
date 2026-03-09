import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { User, LogOut, LogIn, Shield, Settings, Crown, Sparkles, BookOpen, BarChart3, Map, Star, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { ManifestationSection } from '../components/profile/ManifestationSection';
import { UserProfile as UserProfileType } from '../core/types';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { user, profile, login, logout, loading, refreshProfile, setProfile } = useAuth();
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile?.displayName) {
      setEditName(profile.displayName);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      const updated = await userService.updateProfile(user.uid, { displayName: editName });
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("プロフィールの保存に失敗しました。");
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
      // One-click upgrade for testing:
      // 1. Optimistically update the local profile state for instant feedback
      const updatedProfile = { 
        ...profile, 
        role: 'premium_member' as const, 
        subscription_status: 'active' as const 
      };
      setProfile(updatedProfile);

      // 2. Attempt to update Firestore in the background
      userService.updateSubscription(user.uid, 'active').catch(err => {
        console.error("Background upgrade update failed:", err);
      });

      // 3. Brief delay to show the "upgrading" state for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.error("Upgrade failed:", error);
      // Fallback to reload if something goes wrong
      window.location.reload();
    } finally {
      setIsUpgrading(false);
    }
  };

  // Only show full-page loader if we don't even know if the user is logged in yet
  if (loading && !user) {
    return (
      <div className="ma-container py-32 flex items-center justify-center">
        <div className="animate-pulse-soft text-ink-muted uppercase tracking-widest text-xs">聖域を読み込んでいます...</div>
      </div>
    );
  }

  // If not logged in and not loading, show the login prompt (handled inside the return)
  
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
              <span className="text-[10px] uppercase tracking-[0.6em] text-ink-muted">Member Profile</span>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="font-serif tracking-widest bg-white/50 border-b border-ink/20 focus:border-wood outline-none px-2 py-1 text-xl md:text-2xl w-full max-w-[200px]"
                    autoFocus
                  />
                ) : (
                  <h1 className="font-serif tracking-widest">{profile?.displayName || user?.displayName || 'ゲスト'}</h1>
                )}
                {user && !isEditing && (
                  <button 
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-rose-50 text-rose-300 hover:text-rose-500 transition-all group relative"
                    title="サインアウト"
                  >
                    <LogOut size={18} strokeWidth={1.5} />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 backdrop-blur-md px-2 py-1 rounded border border-ink/5">サインアウト</span>
                  </button>
                )}
              </div>
              {profile ? (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full border ${
                    profile.role === 'admin' ? 'border-fire/20 text-fire bg-fire/5' :
                    profile.role === 'premium_member' ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-ink/10 text-ink-muted'
                  } uppercase tracking-widest`}>
                    {profile.role === 'admin' ? 'Administrator' : 
                     profile.role === 'premium_member' ? 'Premium Member' : 'Free Member'}
                  </span>
                </div>
              ) : user ? (
                <div className="h-4 w-24 bg-ink/5 animate-pulse rounded-full mx-auto md:mx-0" />
              ) : null}
            </div>
            <p className="text-sm md:text-lg text-ink-muted font-light tracking-widest">{user ? 'エネルギー共鳴者' : '共鳴を探して'}</p>
            {user && (
              <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em] bg-wood text-white"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.displayName || '');
                      }} 
                      variant="outline"
                      className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em]"
                    >
                      キャンセル
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline" 
                    className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em]"
                  >
                    プロフィール編集
                  </Button>
                )}
                {profile?.role === 'admin' && !isEditing && (
                  <Button 
                    onClick={() => onNavigate?.('admin')}
                    className="h-11 md:h-12 px-6 md:px-8 text-[10px] md:text-xs tracking-[0.2em] bg-fire/10 text-fire border-fire/20 hover:bg-fire hover:text-white"
                  >
                    管理パネル
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
              <h3 className="text-xs uppercase tracking-widest">アカウント・セキュリティ</h3>
            </div>
            {!user ? (
              <>
                <p className="text-sm leading-relaxed">
                  サインインすると、診断結果を保存し、あなたのスピリチュアルな旅を記録することができます。
                </p>
                <Button onClick={login} className="w-full gap-3">
                  <LogIn size={18} /> Googleでサインイン
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed">
                  あなたのデータはGoogleアカウントと安全に同期されています。
                </p>
                <div className="text-sm text-ink-muted py-2 border-t border-ink/5">
                  メール: {user.email}
                </div>
              </>
            )}
          </GlassCard>

          <GlassCard delay={0.4} className="space-y-6">
            <div className="flex items-center gap-3 text-ink-muted">
              <Settings size={18} />
              <h3 className="text-xs uppercase tracking-widest">設定</h3>
            </div>
            <div className="space-y-4">
              {[
                { id: 'daily_reminder', label: '毎日のリマインダー' },
                { id: 'dark_mode', label: 'ダークモード (準備中)' },
                { id: 'newsletter', label: 'ニュースレター' }
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
                        
                        // Optimistic update
                        setProfile({ ...profile, settings: newSettings });
                        
                        try {
                          await userService.updateSettings(user.uid, newSettings);
                        } catch (err) {
                          console.error("Failed to update settings:", err);
                          // Revert on error
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
              <div className="animate-pulse text-[10px] tracking-[0.4em] text-ink-muted uppercase">ステータスを確認中...</div>
            </GlassCard>
          </div>
        ) : profile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            {profile.role === 'premium_member' ? (
              <GlassCard className="bg-amber-50/30 border-amber-200/50 p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start text-amber-600">
                      <Crown size={24} />
                      <h2 className="text-xl md:text-2xl font-serif tracking-widest">Premium エネルギーセンター</h2>
                    </div>
                    <p className="text-sm text-ink-muted max-w-md leading-relaxed">
                      すべてのプレミアム機能が解放されました。ここではエネルギーの流動を深く探索し、ビジョンを具現化できます。
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <Button 
                      onClick={() => onNavigate?.('history')}
                      variant="outline" 
                      className="flex-col h-24 gap-2 border-amber-200 hover:bg-amber-50 text-amber-700"
                    >
                      <Activity size={20} />
                      <span className="text-[10px] tracking-widest">エネルギー軌跡</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 gap-2 border-amber-200 hover:bg-amber-50 text-amber-700">
                      <Map size={20} />
                      <span className="text-[10px] tracking-widest">ビジョンボード</span>
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="bg-indigo-50/30 border-indigo-200/50 p-8 md:p-12 text-center space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 text-indigo-600">
                    <Sparkles size={24} />
                    <h2 className="text-xl md:text-2xl font-serif tracking-widest">Premium体験にアップグレード</h2>
                  </div>
                  <p className="text-sm text-ink-muted max-w-lg mx-auto leading-relaxed">
                    エネルギー日誌、ビジョンボード、詳細な月間レポートを解放し、Lumina OHをあなたの魂の成長の専属ガイドにしましょう。
                  </p>
                </div>
                <Button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white tracking-[0.3em] shadow-xl shadow-indigo-200"
                >
                  {isUpgrading ? 'アップグレード中...' : '今すぐアップグレード'}
                </Button>
              </GlassCard>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
