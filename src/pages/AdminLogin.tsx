import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { user, profile, setProfile, refreshProfile } = useAuth();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setError("使用者資訊尚未載入，請稍後再試。");
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // In a real app, this would be a server-side check.
      // For this implementation, we'll use a secret key from environment variables.
      const adminKey = import.meta.env.VITE_ADMIN_SECRET_KEY || 'lumina-admin-2024';
      
      if (password === adminKey) {
        console.log("AdminLogin: Key matched, updating role for:", user.uid);
        const updatedProfile = await userService.updateRole(user.uid, 'admin');
        setProfile(updatedProfile);
        setStatus('success');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.href = '/';
          }
        }, 2000);
      } else {
        throw new Error('管理者金鑰不正確。');
      }
    } catch (err: any) {
      console.error('Admin login failed:', err);
      setError(err.message || '認證失敗。');
      setStatus('error');
    }
  };

  if (!user) {
    return (
      <div className="ma-container py-32 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-20 h-20 rounded-3xl bg-ink/5 flex items-center justify-center text-ink/20">
          <Shield size={40} strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif tracking-widest">管理者認証</h1>
          <p className="text-sm text-ink-muted">まずサインインしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ma-container py-32 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassCard className="p-10 md:p-12 space-y-10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-fire/10 flex items-center justify-center text-fire mx-auto mb-6">
                <Shield size={32} />
              </div>
              <h2 className="text-xl font-serif tracking-widest uppercase">System Entry</h2>
              <p className="text-[10px] text-ink-muted uppercase tracking-[0.3em]">管理者専用アクセス</p>
            </div>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-12 h-12 rounded-full bg-wood/10 text-wood flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm tracking-widest text-wood">認証に成功しました。リダイレクトします...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <Lock size={12} /> 管理者シークレットキー
                  </label>
                  <input 
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-ink/[0.02] border border-ink/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-fire/30 transition-all font-mono"
                    required
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-fire/10 border border-fire/20 rounded-xl flex items-center gap-3 text-fire text-[10px] tracking-widest"
                  >
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className="w-full h-14 gap-3 bg-fire hover:bg-fire-dark text-white shadow-xl shadow-fire/20"
                >
                  {status === 'loading' ? '認証中...' : (
                    <>
                      アクセスを許可 <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="pt-6 border-t border-ink/5 text-center">
              <p className="text-[9px] text-ink-muted uppercase tracking-[0.2em] leading-relaxed">
                このエリアはシステム管理者のみがアクセス可能です。<br />
                不正なアクセスは記録されます。
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};
