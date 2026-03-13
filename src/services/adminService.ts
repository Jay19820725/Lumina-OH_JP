import { UserProfile, Session, ImageCard, WordCard, AIPrompt } from '../core/types';

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const response = await fetch('/api/admin/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    return await response.json();
  },

  /**
   * User Management
   */
  async getAllUsers(limitCount = 50): Promise<UserProfile[]> {
    // This would need a new endpoint, but for now I'll mock it or add it to server.ts
    const response = await fetch(`/api/admin/users?limit=${limitCount}`);
    if (!response.ok) return [];
    const users = await response.json();
    return users.map((u: any) => ({
      ...u,
      displayName: u.display_name,
      photoURL: u.photo_url,
      register_date: { toDate: () => new Date(u.register_date) },
      last_login: { toDate: () => new Date(u.last_login) }
    }));
  },

  async updateUserRole(uid: string, role: string): Promise<void> {
    await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
  },

  /**
   * Session Data
   */
  async getAllSessions(limitCount = 50): Promise<Session[]> {
    const response = await fetch(`/api/admin/sessions?limit=${limitCount}`);
    if (!response.ok) return [];
    const sessions = await response.json();
    return sessions.map((s: any) => ({
      ...s,
      session_time: { toDate: () => new Date(s.session_time) }
    }));
  },

  async deleteSessionDrafts(): Promise<{ success: boolean; count: number }> {
    const response = await fetch('/api/admin/sessions/drafts', { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete session drafts');
    return await response.json();
  },

  /**
   * Cards Management
   */
  async getAllImageCards(): Promise<ImageCard[]> {
    const response = await fetch('/api/cards/image');
    if (!response.ok) return [];
    const cards = await response.json();
    return cards.map((c: any) => ({
      ...c,
      imageUrl: c.image_url
    }));
  },

  async getAllWordCards(): Promise<WordCard[]> {
    const response = await fetch('/api/cards/word');
    if (!response.ok) return [];
    const cards = await response.json();
    return cards.map((c: any) => ({
      ...c,
      imageUrl: c.image_url
    }));
  },

  async saveImageCard(card: Partial<ImageCard>): Promise<void> {
    await fetch('/api/admin/cards/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
  },

  async saveWordCard(card: Partial<WordCard>): Promise<void> {
    await fetch('/api/admin/cards/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
  },

  async deleteImageCard(id: string): Promise<void> {
    await fetch(`/api/admin/cards/image/${id}`, { method: 'DELETE' });
  },

  async deleteWordCard(id: string): Promise<void> {
    await fetch(`/api/admin/cards/word/${id}`, { method: 'DELETE' });
  },

  /**
   * Subscription Data
   */
  async getSubscriptionData(): Promise<UserProfile[]> {
    const response = await fetch('/api/admin/subscriptions');
    if (!response.ok) return [];
    const users = await response.json();
    return users.map((u: any) => ({
      ...u,
      displayName: u.display_name,
      photoURL: u.photo_url,
      register_date: { toDate: () => new Date(u.register_date) },
      last_login: { toDate: () => new Date(u.last_login) }
    }));
  },

  /**
   * AI Prompt Management
   */
  async getAllPrompts(category?: string): Promise<AIPrompt[]> {
    const url = category ? `/api/admin/prompts?category=${category}` : '/api/admin/prompts';
    const response = await fetch(url);
    if (!response.ok) return [];
    const prompts = await response.json();
    return prompts.map((p: any) => ({
      ...p,
      created_at: { toDate: () => new Date(p.created_at) },
      updated_at: { toDate: () => new Date(p.updated_at) }
    }));
  },

  async savePrompt(prompt: Partial<AIPrompt>): Promise<void> {
    await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });
  },

  async deletePrompt(id: string): Promise<void> {
    await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' });
  },

  async activatePrompt(id: string): Promise<void> {
    await fetch(`/api/admin/prompts/${id}/activate`, { method: 'POST' });
  },

  /**
   * Analytics Dashboard Data
   */
  async getAnalyticsData() {
    const response = await fetch('/api/admin/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    return await response.json();
  },

  /**
   * Site Settings Management
   */
  async getSettings(key: string) {
    const response = await fetch(`/api/settings/${key}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch settings for ${key}`);
    }
    return await response.json();
  },

  async saveSettings(key: string, value: any) {
    const response = await fetch(`/api/admin/settings/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
    if (!response.ok) {
      throw new Error(`Failed to save settings for ${key}`);
    }
    return await response.json();
  }
};
