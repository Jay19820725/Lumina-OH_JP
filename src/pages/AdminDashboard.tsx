import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Database, 
  BarChart, 
  Image as ImageIcon, 
  Type as TypeIcon,
  Search,
  MoreVertical,
  ShieldAlert,
  Calendar,
  Activity,
  UserPlus,
  Crown,
  Plus,
  X,
  Save,
  Trash2,
  Sparkles,
  Zap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings as SettingsIcon,
  Globe,
  Share2,
  BarChart3
} from 'lucide-react';
import { 
  useAdminStats, 
  useAdminUsers, 
  useAdminSessions, 
  useAdminCards, 
  useAdminSubscriptions, 
  useAdminPrompts,
  useAdminAnalytics,
  useAdminSettings,
  useSaveSettingsMutation,
  useSaveCardMutation,
  useDeleteCardMutation,
  useSavePromptMutation,
  useDeletePromptMutation,
  useActivatePromptMutation
} from '../hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';
import { UserProfile, Session, ImageCard, WordCard, FiveElement, AIPrompt, SEOSettings } from '../core/types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Funnel,
  FunnelChart,
  LabelList,
  LineChart,
  Line,
  Legend
} from 'recharts';


type AdminModule = 'dashboard' | 'cards' | 'users' | 'sessions' | 'subscriptions' | 'analytics' | 'prompts' | 'settings';

export const AdminDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AdminModule>('dashboard');
  const queryClient = useQueryClient();
  
  // Queries
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: sessions, isLoading: sessionsLoading } = useAdminSessions();
  const { data: cards, isLoading: cardsLoading } = useAdminCards();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useAdminSubscriptions();
  const { data: prompts, isLoading: promptsLoading } = useAdminPrompts();
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: seoSettings, isLoading: seoLoading } = useAdminSettings('seo');

  // Mutations
  const saveCardMutation = useSaveCardMutation();
  const deleteCardMutation = useDeleteCardMutation();
  const savePromptMutation = useSavePromptMutation();
  const deletePromptMutation = useDeletePromptMutation();
  const activatePromptMutation = useActivatePromptMutation();
  const saveSettingsMutation = useSaveSettingsMutation();

  // Card Editing State
  const [editingCard, setEditingCard] = useState<{ type: 'image' | 'word'; data: any } | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Partial<AIPrompt> | null>(null);
  const [cardTab, setCardTab] = useState<'image' | 'word'>('image');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editingCard]);

  const isLoading = 
    (activeModule === 'dashboard' && statsLoading) ||
    (activeModule === 'users' && usersLoading) ||
    (activeModule === 'sessions' && sessionsLoading) ||
    (activeModule === 'cards' && cardsLoading) ||
    (activeModule === 'subscriptions' && subscriptionsLoading) ||
    (activeModule === 'prompts' && promptsLoading) ||
    (activeModule === 'analytics' && analyticsLoading) ||
    (activeModule === 'settings' && seoLoading);

  const handleSaveCard = async () => {
    if (!editingCard) return;
    try {
      await saveCardMutation.mutateAsync({ type: editingCard.type, data: editingCard.data });
      setEditingCard(null);
    } catch (error) {
      console.error("儲存卡片失敗:", error);
    }
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt) return;
    try {
      await savePromptMutation.mutateAsync(editingPrompt);
      setEditingPrompt(null);
    } catch (error) {
      console.error("儲存 Prompt 失敗:", error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('確定要刪除此 Prompt 嗎？')) return;
    try {
      await deletePromptMutation.mutateAsync(id);
    } catch (error) {
      console.error("刪除 Prompt 失敗:", error);
    }
  };

  const handleActivatePrompt = async (id: string) => {
    try {
      await activatePromptMutation.mutateAsync(id);
    } catch (error) {
      console.error("啟用 Prompt 失敗:", error);
    }
  };

  const handleSaveSettings = async (key: string, value: any) => {
    try {
      await saveSettingsMutation.mutateAsync({ key, value });
      alert('設定已儲存');
    } catch (error) {
      console.error("儲存設定失敗:", error);
      alert('儲存失敗');
    }
  };

  const handleDeleteCard = async (type: 'image' | 'word', id: string) => {
    if (!confirm('確定要刪除此卡片嗎？')) return;
    try {
      await deleteCardMutation.mutateAsync({ type, id });
    } catch (error) {
      console.error("刪除卡片失敗:", error);
    }
  };

  const renderDashboard = () => {
    if (!stats) return null;

    const chartData = [
      { name: '日活', value: stats.dau, color: '#8BA889' },
      { name: '抽卡', value: stats.dailySessions, color: '#D98B73' },
      { name: '新客', value: stats.newUsers, color: '#C4B08B' },
      { name: '訂閱', value: stats.premiumSubscriptions, color: '#6B7B8C' },
    ];

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="日活躍用戶 (DAU)" value={stats.dau} icon={<Activity className="text-wood" />} />
          <StatCard title="今日抽卡次數" value={stats.dailySessions} icon={<Database className="text-fire" />} />
          <StatCard title="今日新會員" value={stats.newUsers} icon={<UserPlus className="text-earth" />} />
          <StatCard title="尊榮會員總數" value={stats.premiumSubscriptions} icon={<Crown className="text-water" />} />
        </div>

        <GlassCard className="p-8 h-[400px]">
          <h3 className="text-xs uppercase tracking-[0.3em] text-ink-muted mb-8">今日營運概況</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.8)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    );
  };

  const renderUsers = () => (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-ink/5 flex justify-between items-center bg-white/20">
        <h3 className="text-xs uppercase tracking-widest">會員管理</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/20" size={14} />
          <input 
            type="text" 
            placeholder="搜尋用戶..." 
            className="pl-9 pr-4 py-2 bg-white/40 border border-ink/5 rounded-full text-xs focus:outline-none focus:border-wood/30 transition-colors"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-ink/5 text-ink-muted uppercase tracking-widest">
              <th className="px-6 py-4 font-medium">用戶</th>
              <th className="px-6 py-4 font-medium">角色</th>
              <th className="px-6 py-4 font-medium">加入日期</th>
              <th className="px-6 py-4 font-medium">最後登入</th>
              <th className="px-6 py-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {users?.map(user => (
              <tr key={user.uid} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center overflow-hidden">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <Users size={14} />}
                    </div>
                    <div>
                      <p className="font-medium">{user.displayName || '匿名用戶'}</p>
                      <p className="text-[10px] text-ink-muted">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${
                    user.role === 'admin' ? 'bg-fire/10 text-fire' : 
                    user.role === 'premium_member' ? 'bg-amber-100 text-amber-700' : 'bg-ink/5 text-ink-muted'
                  }`}>
                    {user.role === 'admin' ? '管理員' : user.role === 'premium_member' ? '尊榮會員' : '一般會員'}
                  </span>
                </td>
                <td className="px-6 py-4 text-ink-muted">{formatDate(user.register_date)}</td>
                <td className="px-6 py-4 text-ink-muted">{formatDate(user.last_login)}</td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                    <MoreVertical size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );

  const renderCards = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex bg-ink/5 p-1 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setCardTab('image')}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all ${
              cardTab === 'image' ? 'bg-white text-wood shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            圖像卡 ({cards?.images.length || 0})
          </button>
          <button 
            onClick={() => setCardTab('word')}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all ${
              cardTab === 'word' ? 'bg-white text-fire shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            文字卡 ({cards?.words.length || 0})
          </button>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            onClick={() => setEditingCard({ 
              type: 'image', 
              data: { imageUrl: '', elements: { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 } } 
            })}
            className="flex-1 md:flex-none gap-2 h-11 px-6 text-[10px] uppercase tracking-widest"
          >
            <Plus size={14} /> 新增圖像卡
          </Button>
          <Button 
            onClick={() => setEditingCard({ 
              type: 'word', 
              data: { text: '', imageUrl: '', elements: { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 } } 
            })}
            className="flex-1 md:flex-none gap-2 h-11 px-6 text-[10px] uppercase tracking-widest"
          >
            <Plus size={14} /> 新增文字卡
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {cardTab === 'image' ? (
          <motion.div
            key="image-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
                {cards?.images.map(card => (
                  <div key={card.id} className="aspect-[3/4] rounded-2xl overflow-hidden bg-ink/5 border border-ink/5 group relative shadow-sm hover:shadow-md transition-all">
                    <img src={card.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingCard({ type: 'image', data: card })}
                        className="h-9 px-4 text-[10px] border-white/30 text-white hover:bg-white/10 uppercase tracking-widest"
                      >
                        編輯
                      </Button>
                      <button 
                        onClick={() => handleDeleteCard('image', card.id)}
                        className="p-2 text-rose-400 hover:text-rose-500 transition-colors bg-white/10 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="word-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GlassCard className="p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-ink/[0.02] border-b border-ink/5">
                      <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-ink-muted font-medium">預覽</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-ink-muted font-medium">關鍵字</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-ink-muted font-medium">五行能量</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-ink-muted font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {cards?.words.map(card => (
                      <tr key={card.id} className="hover:bg-ink/[0.01] transition-colors group">
                        <td className="px-8 py-4">
                          {card.imageUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-ink/5 shadow-sm">
                              <img src={card.imageUrl} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-serif text-ink">{card.text}</span>
                          <div className="text-[9px] text-ink-muted mt-1 uppercase tracking-widest opacity-50">ID: {card.id}</div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex gap-1.5">
                            {Object.entries(card.elements).map(([el, val]) => (
                              <div key={el} className="flex flex-col items-center gap-1">
                                <div className={`w-1 h-8 rounded-full bg-ink/5 relative overflow-hidden`}>
                                  <div 
                                    className={`absolute bottom-0 left-0 right-0 rounded-full ${
                                      el === 'wood' ? 'bg-wood' : 
                                      el === 'fire' ? 'bg-fire' : 
                                      el === 'earth' ? 'bg-earth' : 
                                      el === 'metal' ? 'bg-metal' : 'bg-water'
                                    }`}
                                    style={{ height: `${val}%` }}
                                  />
                                </div>
                                <span className="text-[8px] text-ink-muted uppercase">{el[0]}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingCard({ type: 'word', data: card })}
                              className="h-8 px-4 text-[9px] uppercase tracking-widest"
                            >
                              編輯
                            </Button>
                            <button 
                              onClick={() => handleDeleteCard('word', card.id)}
                              className="p-2 text-rose-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Edit Modal via Portal */}
      {editingCard && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCard(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-ink/5 flex justify-between items-center bg-ink/[0.02]">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-2xl ${editingCard.type === 'image' ? 'bg-wood/10 text-wood' : 'bg-fire/10 text-fire'}`}>
                    {editingCard.type === 'image' ? <ImageIcon size={20} /> : <TypeIcon size={20} />}
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold text-ink">
                      {editingCard.data.id ? '編輯' : '新增'} {editingCard.type === 'image' ? '圖像' : '文字'}卡
                    </h3>
                    <p className="text-[9px] text-ink-muted uppercase tracking-widest mt-1">
                      {editingCard.data.id || 'New Card'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingCard(null)} 
                  className="p-3 hover:bg-ink/5 rounded-full transition-all hover:rotate-90 duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  {/* Left Column: Visual Preview */}
                  <div className="md:col-span-5 space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">卡片預覽</label>
                    <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-ink/5 border border-ink/5 shadow-inner relative group">
                      {editingCard.data.imageUrl ? (
                        <>
                          <img src={editingCard.data.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ink/10 gap-4">
                          <ImageIcon size={64} strokeWidth={1} />
                          <span className="text-[10px] uppercase tracking-widest">等待輸入網址...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Data Entry */}
                  <div className="md:col-span-7 space-y-8">
                    <div className="space-y-6">
                      {editingCard.type === 'word' && (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">關鍵字文本</label>
                          <input 
                            type="text" 
                            value={editingCard.data.text}
                            onChange={(e) => setEditingCard({ ...editingCard, data: { ...editingCard.data, text: e.target.value } })}
                            className="w-full px-5 py-4 bg-ink/[0.02] border border-ink/5 rounded-2xl text-sm focus:outline-none focus:border-wood/30 focus:bg-white transition-all shadow-sm"
                            placeholder="輸入關鍵字..."
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">圖片 URL</label>
                        <input 
                          type="text" 
                          value={editingCard.data.imageUrl}
                          onChange={(e) => setEditingCard({ ...editingCard, data: { ...editingCard.data, imageUrl: e.target.value } })}
                          className="w-full px-5 py-4 bg-ink/[0.02] border border-ink/5 rounded-2xl text-sm focus:outline-none focus:border-wood/30 focus:bg-white transition-all shadow-sm"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-ink/5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">五行能量數值 (%)</label>
                        <div className="flex gap-2">
                          {Object.values(FiveElement).map(el => (
                            <div key={el} className={`w-2 h-2 rounded-full ${
                              el === 'wood' ? 'bg-wood' : 
                              el === 'fire' ? 'bg-fire' : 
                              el === 'earth' ? 'bg-earth' : 
                              el === 'metal' ? 'bg-metal' : 'bg-water'
                            }`} />
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-5">
                        {Object.values(FiveElement).map((element) => (
                          <div key={element} className="space-y-3">
                            <div className="flex justify-between text-[10px] uppercase tracking-widest">
                              <span className="text-ink font-medium">{element}</span>
                              <span className="font-mono text-ink-muted">{editingCard.data.elements[element]}%</span>
                            </div>
                            <div className="relative flex items-center">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={editingCard.data.elements[element]}
                                onChange={(e) => setEditingCard({ 
                                  ...editingCard, 
                                  data: { 
                                    ...editingCard.data, 
                                    elements: { ...editingCard.data.elements, [element]: parseInt(e.target.value) } 
                                  } 
                                })}
                                className="w-full h-1.5 bg-ink/5 rounded-full appearance-none cursor-pointer accent-ink"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-ink/[0.02] border-t border-ink/5 flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingCard(null)}
                  className="px-8 h-12 rounded-2xl text-[10px] uppercase tracking-widest"
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSaveCard} 
                  disabled={saveCardMutation.isPending} 
                  className="gap-3 px-10 h-12 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-wood/10"
                >
                  {saveCardMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <><Save size={16} /> 儲存卡片變更</>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );

  const renderPrompts = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select 
            className="bg-white/40 border border-ink/5 rounded-xl px-4 py-2 text-xs focus:outline-none"
            onChange={(e) => {
              // Filter logic can be added here if we want client-side filtering
              // or we can update the useAdminPrompts hook to accept filters
            }}
          >
            <option value="">所有分類</option>
            <option value="analysis">能量分析</option>
            <option value="daily">每日指引</option>
            <option value="manifestation">願望顯化</option>
            <option value="persona">人格設定</option>
          </select>
          <select 
            className="bg-white/40 border border-ink/5 rounded-xl px-4 py-2 text-xs focus:outline-none"
          >
            <option value="">所有語言</option>
            <option value="zh-TW">繁體中文</option>
            <option value="ja-JP">日文</option>
          </select>
        </div>
        <Button 
          onClick={() => setEditingPrompt({ 
            prompt_name: '', 
            prompt_content: '', 
            version: '1.0.0', 
            status: 'draft',
            category: 'analysis',
            lang: 'zh-TW',
            is_default: false,
            ab_test_group: 'control'
          })}
          className="gap-2 h-10 px-4 text-xs"
        >
          <Plus size={14} /> 新增 Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {prompts?.map(prompt => (
          <GlassCard key={prompt.id} className="p-6 overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${prompt.status === 'active' ? 'bg-wood/10 text-wood' : 'bg-ink/5 text-ink-muted'}`}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-serif">{prompt.prompt_name}</h4>
                    {prompt.is_default && (
                      <span className="text-[8px] bg-wood text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Default</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] uppercase tracking-widest bg-ink/5 px-1.5 py-0.5 rounded text-ink-muted">v{prompt.version}</span>
                    <span className="text-[9px] uppercase tracking-widest bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{prompt.category}</span>
                    <span className="text-[9px] uppercase tracking-widest bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{prompt.lang}</span>
                    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      prompt.status === 'active' ? 'bg-wood/10 text-wood' : 
                      prompt.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-ink/5 text-ink-muted'
                    }`}>
                      {prompt.status === 'active' ? '已啟用' : prompt.status === 'draft' ? '草稿' : '已封存'}
                    </span>
                    {prompt.ab_test_group && (
                      <span className="text-[9px] uppercase tracking-widest bg-fire/10 text-fire px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Zap size={8} /> A/B 測試: {prompt.ab_test_group}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {prompt.status !== 'active' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleActivatePrompt(prompt.id)}
                    className="h-8 px-3 text-[9px] border-wood/30 text-wood hover:bg-wood/5"
                  >
                    啟用
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setEditingPrompt(prompt)}
                  className="h-8 px-3 text-[9px]"
                >
                  編輯
                </Button>
                <button 
                  onClick={() => handleDeletePrompt(prompt.id)}
                  className="p-2 text-rose-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="bg-ink/[0.02] rounded-xl p-4 border border-ink/5">
              <p className="text-xs text-ink-muted line-clamp-3 font-mono leading-relaxed">
                {prompt.prompt_content}
              </p>
            </div>
            <div className="mt-4 flex justify-between items-center text-[9px] text-ink-muted uppercase tracking-widest">
              <span>最後更新: {formatDate(prompt.updated_at)}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">ID: {prompt.id}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Prompt Edit Modal */}
      <AnimatePresence>
        {editingPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPrompt(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-ink/5 flex justify-between items-center bg-ink/[0.02]">
                <h3 className="text-xs uppercase tracking-[0.3em] font-medium">
                  {editingPrompt.id ? '編輯' : '新增'} AI Prompt
                </h3>
                <button onClick={() => setEditingPrompt(null)} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted">Prompt 名稱</label>
                    <input 
                      type="text" 
                      value={editingPrompt.prompt_name}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_name: e.target.value })}
                      className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                      placeholder="例如：卡片分析主提示詞"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted">版本號</label>
                    <input 
                      type="text" 
                      value={editingPrompt.version}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, version: e.target.value })}
                      className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                      placeholder="v1.0.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink-muted">Prompt 內容</label>
                  <textarea 
                    value={editingPrompt.prompt_content}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_content: e.target.value })}
                    className="w-full h-64 px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm font-mono focus:outline-none focus:border-wood/30 resize-none leading-relaxed"
                    placeholder="請輸入 AI 提示詞內容..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted">分類</label>
                    <select 
                      value={editingPrompt.category}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                    >
                      <option value="analysis">能量分析</option>
                      <option value="daily">每日指引</option>
                      <option value="manifestation">願望顯化</option>
                      <option value="persona">人格設定</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted">語言</label>
                    <select 
                      value={editingPrompt.lang}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, lang: e.target.value as any })}
                      className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                    >
                      <option value="zh-TW">繁體中文</option>
                      <option value="ja-JP">日文</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-muted">狀態</label>
                    <select 
                      value={editingPrompt.status}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                    >
                      <option value="draft">草稿 (Draft)</option>
                      <option value="active">啟用 (Active)</option>
                      <option value="archived">封存 (Archived)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" 
                      id="is_default"
                      checked={editingPrompt.is_default}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, is_default: e.target.checked })}
                      className="w-4 h-4 rounded border-ink/10 text-wood focus:ring-wood"
                    />
                    <label htmlFor="is_default" className="text-[10px] uppercase tracking-widest text-ink-muted cursor-pointer">設為該分類預設</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-ink-muted">A/B 測試分組</label>
                  <select 
                    value={editingPrompt.ab_test_group || 'control'}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, ab_test_group: e.target.value as any })}
                    className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                  >
                    <option value="control">對照組 (Control)</option>
                    <option value="A">實驗組 A</option>
                    <option value="B">實驗組 B</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-ink/[0.02] border-t border-ink/5 flex justify-end gap-4">
                <Button variant="outline" onClick={() => setEditingPrompt(null)}>取消</Button>
                <Button onClick={handleSavePrompt} disabled={savePromptMutation.isPending} className="gap-2 px-8">
                  {savePromptMutation.isPending ? '儲存中...' : <><Save size={16} /> 儲存 Prompt</>}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="space-y-8">
        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="今日活躍 (DAU)" value={analytics.metrics.dau} icon={<Activity className="text-wood" />} />
          <StatCard title="累計抽卡次數" value={analytics.metrics.totalSessions} icon={<Database className="text-fire" />} />
          <StatCard title="付費轉化率" value={analytics.metrics.premiumConversion as any} icon={<Crown className="text-water" />} />
          <StatCard title="總會員數" value={analytics.metrics.totalUsers} icon={<Users className="text-earth" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 7 Day Trend */}
          <GlassCard className="p-8 h-[400px]">
            <h3 className="text-xs uppercase tracking-[0.3em] text-ink-muted mb-8">7 日趨勢分析</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trends.sevenDays}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="dau" name="活躍用戶" stroke="#8BA889" strokeWidth={2} dot={{ r: 4, fill: '#8BA889' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sessions" name="抽卡次數" stroke="#D98B73" strokeWidth={2} dot={{ r: 4, fill: '#D98B73' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* 30 Day Trend */}
          <GlassCard className="p-8 h-[400px]">
            <h3 className="text-xs uppercase tracking-[0.3em] text-ink-muted mb-8">30 日趨勢分析</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trends.thirtyDays}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none' }}
                />
                <Line type="monotone" dataKey="dau" name="活躍用戶" stroke="#8BA889" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="sessions" name="抽卡次數" stroke="#D98B73" strokeWidth={1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Funnel */}
          <GlassCard className="p-8 h-[450px]">
            <h3 className="text-xs uppercase tracking-[0.3em] text-ink-muted mb-8">用戶轉化漏斗</h3>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={analytics.funnelData}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#888" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Emotion Distribution */}
          <GlassCard className="p-8 h-[450px]">
            <h3 className="text-xs uppercase tracking-[0.3em] text-ink-muted mb-8">情緒能量分佈</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.emotionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.emotionDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#8BA889', '#D98B73', '#C4B08B', '#6B7B8C', '#A88B89'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (!seoSettings) return null;

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-[0.3em] font-medium">SEO 與全站設定</h3>
          <Button 
            onClick={() => handleSaveSettings('seo', seoSettings)}
            disabled={saveSettingsMutation.isPending}
            className="gap-2 h-10 px-6"
          >
            {saveSettingsMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            儲存所有設定
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic SEO */}
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 text-wood">
              <Globe size={18} />
              <h3 className="text-xs uppercase tracking-widest">基礎 SEO 設定</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-ink-muted">網站標題 (Title)</label>
                <input 
                  type="text" 
                  value={seoSettings.title}
                  onChange={(e) => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, title: e.target.value })}
                  className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-ink-muted">網站描述 (Description)</label>
                <textarea 
                  value={seoSettings.description}
                  onChange={(e) => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, description: e.target.value })}
                  className="w-full h-32 px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-ink-muted">關鍵字 (Keywords)</label>
                <input 
                  type="text" 
                  value={seoSettings.keywords}
                  onChange={(e) => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, keywords: e.target.value })}
                  className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-ink/[0.02] rounded-xl border border-ink/5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-medium">搜尋引擎索引</p>
                  <p className="text-[8px] text-ink-muted tracking-widest mt-1">開啟後 Google 才能搜尋到網站</p>
                </div>
                <button 
                  onClick={() => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, index_enabled: !seoSettings.index_enabled })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${seoSettings.index_enabled ? 'bg-wood' : 'bg-ink/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${seoSettings.index_enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Social Share */}
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 text-fire">
              <Share2 size={18} />
              <h3 className="text-xs uppercase tracking-widest">社群分享設定 (OG)</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-ink-muted">預設分享圖 URL</label>
                <input 
                  type="text" 
                  value={seoSettings.og_image}
                  onChange={(e) => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, og_image: e.target.value })}
                  className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                />
              </div>
              
              <div className="aspect-[1.91/1] rounded-2xl overflow-hidden bg-ink/5 border border-ink/5">
                {seoSettings.og_image ? (
                  <img src={seoSettings.og_image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/10">
                    <ImageIcon size={48} />
                  </div>
                )}
              </div>
              <p className="text-[8px] text-ink-muted text-center tracking-widest">建議尺寸: 1200 x 630 px</p>
            </div>
          </GlassCard>

          {/* Analytics & Verification */}
          <GlassCard className="p-8 space-y-6 lg:col-span-2">
            <div className="flex items-center gap-3 text-water">
              <BarChart3 size={18} />
              <h3 className="text-xs uppercase tracking-widest">追蹤與驗證</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-ink-muted">Google Analytics ID (GA4)</label>
                <input 
                  type="text" 
                  placeholder="G-XXXXXXXXXX"
                  value={seoSettings.google_analytics_id}
                  onChange={(e) => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, google_analytics_id: e.target.value })}
                  className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-ink-muted">Search Console 驗證碼</label>
                <input 
                  type="text" 
                  placeholder="驗證碼內容"
                  value={seoSettings.search_console_id}
                  onChange={(e) => queryClient.setQueryData(['admin', 'settings', 'seo'], { ...seoSettings, search_console_id: e.target.value })}
                  className="w-full px-4 py-3 bg-ink/[0.02] border border-ink/5 rounded-xl text-sm focus:outline-none focus:border-wood/30"
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };

  const renderSessions = () => (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-ink/5 bg-white/20">
        <h3 className="text-xs uppercase tracking-widest">抽卡數據監測</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-ink/5 text-ink-muted uppercase tracking-widest">
              <th className="px-6 py-4 font-medium">會議 ID</th>
              <th className="px-6 py-4 font-medium">用戶 ID</th>
              <th className="px-6 py-4 font-medium">時間</th>
              <th className="px-6 py-4 font-medium">卡片組合</th>
              <th className="px-6 py-4 font-medium">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {sessions?.map(session => (
              <tr key={session.id} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-[10px]">{session.id}</td>
                <td className="px-6 py-4 font-mono text-[10px]">{session.user_id}</td>
                <td className="px-6 py-4 text-ink-muted">{formatDate(session.session_time)}</td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {session.image_cards.map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-white overflow-hidden bg-ink/5">
                        <img src={c.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${
                    session.pairs.length > 0 ? 'bg-wood/10 text-wood' : 'bg-ink/5 text-ink-muted'
                  }`}>
                    {session.pairs.length > 0 ? '已完成' : '草稿'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );

  const renderSubscriptions = () => (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b border-ink/5 bg-white/20">
        <h3 className="text-xs uppercase tracking-widest">訂閱管理</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-ink/5 text-ink-muted uppercase tracking-widest">
              <th className="px-6 py-4 font-medium">用戶</th>
              <th className="px-6 py-4 font-medium">狀態</th>
              <th className="px-6 py-4 font-medium">方案</th>
              <th className="px-6 py-4 font-medium">會員起始日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {subscriptions?.map(user => (
              <tr key={user.uid} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium">{user.displayName || '匿名用戶'}</p>
                  <p className="text-[10px] text-ink-muted">{user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${
                    user.subscription_status === 'active' ? 'bg-wood/10 text-wood' : 'bg-fire/10 text-fire'
                  }`}>
                    {user.subscription_status === 'active' ? '使用中' : '已過期'}
                  </span>
                </td>
                <td className="px-6 py-4 uppercase tracking-widest text-[10px]">
                  {user.role === 'premium_member' ? '尊榮會員' : '一般會員'}
                </td>
                <td className="px-6 py-4 text-ink-muted">{formatDate(user.register_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );

  return (
    <div className="ma-container pt-24 pb-32 min-h-screen">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-8">
          <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-xl bg-fire/10 flex items-center justify-center text-fire">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-sm font-serif tracking-widest">管理後台</h2>
              <p className="text-[10px] text-ink-muted uppercase tracking-widest">系統控制中心</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavButton 
              active={activeModule === 'dashboard'} 
              onClick={() => setActiveModule('dashboard')} 
              icon={<LayoutDashboard size={18} />} 
              label="儀表板" 
            />
            <NavButton 
              active={activeModule === 'cards'} 
              onClick={() => setActiveModule('cards')} 
              icon={<ImageIcon size={18} />} 
              label="卡片管理" 
            />
            <NavButton 
              active={activeModule === 'prompts'} 
              onClick={() => setActiveModule('prompts')} 
              icon={<Sparkles size={18} />} 
              label="AI Prompt 管理" 
            />
            <NavButton 
              active={activeModule === 'users'} 
              onClick={() => setActiveModule('users')} 
              icon={<Users size={18} />} 
              label="會員管理" 
            />
            <NavButton 
              active={activeModule === 'sessions'} 
              onClick={() => setActiveModule('sessions')} 
              icon={<Database size={18} />} 
              label="抽卡數據" 
            />
            <NavButton 
              active={activeModule === 'subscriptions'} 
              onClick={() => setActiveModule('subscriptions')} 
              icon={<CreditCard size={18} />} 
              label="訂閱管理" 
            />
            <NavButton 
              active={activeModule === 'analytics'} 
              onClick={() => setActiveModule('analytics')} 
              icon={<BarChart size={18} />} 
              label="營運分析" 
            />
            <NavButton 
              active={activeModule === 'settings'} 
              onClick={() => setActiveModule('settings')} 
              icon={<SettingsIcon size={18} />} 
              label="SEO 設定" 
            />
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-pulse-soft text-[10px] tracking-[0.4em] text-ink-muted uppercase">模組讀取中...</div>
                </div>
              ) : (
                <>
                  {activeModule === 'dashboard' && renderDashboard()}
                  {activeModule === 'users' && renderUsers()}
                  {activeModule === 'cards' && renderCards()}
                  {activeModule === 'prompts' && renderPrompts()}
                  {activeModule === 'sessions' && renderSessions()}
                  {activeModule === 'subscriptions' && renderSubscriptions()}
                  {activeModule === 'analytics' && renderAnalytics()}
                  {activeModule === 'settings' && renderSettings()}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <GlassCard className="p-6 flex flex-col justify-between h-32">
    <div className="flex justify-between items-start">
      <span className="text-[10px] uppercase tracking-widest text-ink-muted">{title}</span>
      <div className="p-2 rounded-lg bg-white/40 border border-white/60">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-serif">{value}</div>
  </GlassCard>
);

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
      active ? 'bg-ink text-white shadow-xl shadow-ink/10' : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
    }`}
  >
    {icon}
    <span className="text-xs font-medium tracking-wide">{label}</span>
  </button>
);

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
