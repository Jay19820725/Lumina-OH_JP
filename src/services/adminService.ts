import { UserProfile, Session, ImageCard, WordCard, AIPrompt } from '../core/types';
import { getFullStorageUrl, getRelativePath } from '../utils/urlHelper';

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
      photoURL: u.photo_url
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
    return sessions;
  },

  async deleteSessionDrafts(): Promise<{ success: boolean; count: number }> {
    const response = await fetch('/api/admin/sessions/drafts', { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete session drafts');
    return await response.json();
  },

  /**
   * Cards Management
   */
  async getAllImageCards(locale?: string): Promise<ImageCard[]> {
    const url = locale ? `/api/cards/image?locale=${locale}` : '/api/cards/image';
    const response = await fetch(url);
    if (!response.ok) return [];
    const cards = await response.json();
    return cards.map((c: any) => ({
      ...c,
      imageUrl: getFullStorageUrl(c.image_url)
    }));
  },

  async getAllWordCards(locale?: string): Promise<WordCard[]> {
    const url = locale ? `/api/cards/word?locale=${locale}` : '/api/cards/word';
    const response = await fetch(url);
    if (!response.ok) return [];
    const cards = await response.json();
    return cards.map((c: any) => ({
      ...c,
      imageUrl: getFullStorageUrl(c.image_url)
    }));
  },

  async saveImageCard(card: Partial<ImageCard>): Promise<void> {
    const data = {
      ...card,
      image_url: card.imageUrl ? getRelativePath(card.imageUrl) : undefined
    };
    await fetch('/api/admin/cards/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async saveWordCard(card: Partial<WordCard>): Promise<void> {
    const data = {
      ...card,
      image_url: card.imageUrl ? getRelativePath(card.imageUrl) : undefined
    };
    await fetch('/api/admin/cards/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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
      photoURL: u.photo_url
    }));
  },

  /**
   * Report Management
   */
  async getAllReports(email?: string, limit = 50, offset = 0): Promise<{ reports: any[], total: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (email) params.append('email', email);
    
    const response = await fetch(`/api/admin/reports?${params.toString()}`);
    if (!response.ok) return { reports: [], total: 0 };
    return await response.json();
  },

  async deleteReport(id: string): Promise<void> {
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete report');
  },

  async deleteReports(ids: string[]): Promise<void> {
    const response = await fetch('/api/admin/reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) throw new Error('Failed to delete reports');
  },

  /**
   * AI Prompt Management
   */
  async getAllPrompts(category?: string): Promise<AIPrompt[]> {
    const url = category ? `/api/admin/prompts?category=${category}` : '/api/admin/prompts';
    const response = await fetch(url);
    if (!response.ok) return [];
    const prompts = await response.json();
    return prompts;
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
  },

  /**
   * Music Management
   */
  async getAllMusic(): Promise<any[]> {
    const response = await fetch('/api/admin/music');
    if (!response.ok) return [];
    return await response.json();
  },

  async saveMusic(track: any): Promise<void> {
    await fetch('/api/admin/music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track)
    });
  },

  async deleteMusic(id: string): Promise<void> {
    await fetch(`/api/admin/music/${id}`, { method: 'DELETE' });
  }
};
