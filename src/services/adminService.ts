import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Session, ImageCard, WordCard, AIPrompt, Bottle, BottleTag } from '../core/types';
import { getFullStorageUrl, getRelativePath } from '../utils/urlHelper';

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    // For now, we can fetch some real stats from Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
    const bottlesSnap = await getDocs(collection(db, 'bottles'));
    const sessionsSnap = await getDocs(collection(db, 'sessions'));
    
    return {
      totalUsers: usersSnap.size,
      totalBottles: bottlesSnap.size,
      totalSessions: sessionsSnap.size,
      activeUsersToday: 0,
      dau: 0,
      dailySessions: 0,
      newUsers: 0,
      premiumSubscriptions: 0
    };
  },

  /**
   * User Management
   */
  async getAllUsers(limitCount = 50): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
  },

  async updateUserRole(uid: string, role: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  },

  /**
   * Session Data
   */
  async getAllSessions(limitCount = 50): Promise<Session[]> {
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, orderBy('created_at', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Session));
  },

  async deleteSessionDrafts(): Promise<{ success: boolean; count: number }> {
    // Complex to implement in Firestore without cloud functions, 
    // but we can delete sessions with no pairs
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, where('pairs', '==', []));
    const snap = await getDocs(q);
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'sessions', d.id));
      count++;
    }
    return { success: true, count };
  },

  /**
   * Cards Management (Still using API for now as they are static assets)
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('subscription_status', '==', 'active'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
  },

  /**
   * Report Management
   */
  async getAllReports(email?: string, limitCount = 50, offset = 0): Promise<{ reports: any[], total: number }> {
    const reportsRef = collection(db, 'energy_reports');
    // Firestore doesn't support offset well, so we just limit for now
    const q = query(reportsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const reports = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    return { reports, total: reports.length };
  },

  async deleteReport(id: string): Promise<void> {
    await deleteDoc(doc(db, 'energy_reports', id));
  },

  async deleteReports(ids: string[]): Promise<void> {
    for (const id of ids) {
      await deleteDoc(doc(db, 'energy_reports', id));
    }
  },

  /**
   * AI Prompt Management
   */
  async getAllPrompts(category?: string): Promise<AIPrompt[]> {
    const promptsRef = collection(db, 'prompts');
    let q = query(promptsRef, orderBy('created_at', 'desc'));
    if (category) {
      q = query(promptsRef, where('category', '==', category), orderBy('created_at', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AIPrompt));
  },

  async savePrompt(prompt: Partial<AIPrompt>): Promise<void> {
    if (prompt.id) {
      const promptRef = doc(db, 'prompts', prompt.id);
      const { id, ...data } = prompt;
      await updateDoc(promptRef, { ...data, updated_at: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'prompts'), {
        ...prompt,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
  },

  async deletePrompt(id: string): Promise<void> {
    await deleteDoc(doc(db, 'prompts', id));
  },

  async activatePrompt(id: string): Promise<void> {
    const promptRef = doc(db, 'prompts', id);
    const promptSnap = await getDoc(promptRef);
    if (!promptSnap.exists()) return;
    
    const { lang } = promptSnap.data();
    
    // Deactivate others in same language
    const q = query(collection(db, 'prompts'), where('lang', '==', lang), where('is_active', '==', true));
    const activeSnaps = await getDocs(q);
    for (const d of activeSnaps.docs) {
      await updateDoc(doc(db, 'prompts', d.id), { is_active: false });
    }
    
    // Activate this one
    await updateDoc(promptRef, { is_active: true });
  },

  /**
   * Analytics Dashboard Data
   */
  async getAnalyticsData() {
    // Simplified for Firestore
    return {
      userGrowth: [],
      conversionRate: 0,
      popularElements: {},
      metrics: {
        dau: 0,
        retention: 0,
        avgSessionTime: 0,
        conversion: 0,
        totalSessions: 0,
        premiumConversion: 0,
        totalUsers: 0
      },
      trends: {
        sevenDays: [],
        thirtyDays: []
      },
      funnelData: [],
      emotionDistribution: []
    };
  },

  /**
   * Site Settings Management
   */
  async getSettings(key: string) {
    const settingsRef = doc(db, 'settings', key);
    const snap = await getDoc(settingsRef);
    return snap.exists() ? snap.data() : null;
  },

  async saveSettings(key: string, value: any) {
    const settingsRef = doc(db, 'settings', key);
    await updateDoc(settingsRef, { ...value, updated_at: serverTimestamp() });
    return { success: true };
  },

  /**
   * Music Management
   */
  async getAllMusic(): Promise<any[]> {
    const musicRef = collection(db, 'music');
    const snap = await getDocs(musicRef);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },

  async saveMusic(track: any): Promise<void> {
    if (track.id) {
      const musicRef = doc(db, 'music', track.id);
      const { id, ...data } = track;
      await updateDoc(musicRef, data);
    } else {
      await addDoc(collection(db, 'music'), track);
    }
  },

  async deleteMusic(id: string): Promise<void> {
    await deleteDoc(doc(db, 'music', id));
  },

  /**
   * Ocean of Resonance Management
   */
  async getAllBottles(limitCount = 50, offset = 0): Promise<{ bottles: any[], total: number }> {
    const bottlesRef = collection(db, 'bottles');
    const q = query(bottlesRef, orderBy('created_at', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const bottles = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    return { bottles, total: bottles.length };
  },

  async deleteBottle(id: string): Promise<void> {
    await deleteDoc(doc(db, 'bottles', id));
  },

  async getAllBottleTags(): Promise<BottleTag[]> {
    const tagsRef = collection(db, 'bottle_tags');
    const snap = await getDocs(tagsRef);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as BottleTag));
  },

  async saveBottleTag(tag: any): Promise<void> {
    if (tag.id) {
      const tagRef = doc(db, 'bottle_tags', tag.id);
      const { id, ...data } = tag;
      await updateDoc(tagRef, data);
    } else {
      await addDoc(collection(db, 'bottle_tags'), tag);
    }
  },

  async deleteBottleTag(id: string): Promise<void> {
    await deleteDoc(doc(db, 'bottle_tags', id));
  },

  async getAllSensitiveWords(): Promise<any[]> {
    const wordsRef = collection(db, 'sensitive_words');
    const snap = await getDocs(wordsRef);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },

  async saveSensitiveWord(word: any): Promise<void> {
    if (word.id) {
      const wordRef = doc(db, 'sensitive_words', word.id);
      const { id, ...data } = word;
      await updateDoc(wordRef, data);
    } else {
      await addDoc(collection(db, 'sensitive_words'), word);
    }
  },

  async deleteSensitiveWord(id: string): Promise<void> {
    await deleteDoc(doc(db, 'sensitive_words', id));
  }
};
