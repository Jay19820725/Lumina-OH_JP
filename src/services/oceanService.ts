import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc, increment, serverTimestamp, getDoc, startAt } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bottle, BottleTag } from '../core/types';

// Simple cache for sensitive words to reduce DB reads
let sensitiveWordsCache: string[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

export const oceanService = {
  /**
   * Cast a new bottle
   */
  async castBottle(data: any): Promise<string> {
    try {
      // 1. Check sensitive words
      const now = Date.now();
      if (!sensitiveWordsCache || now - lastCacheUpdate > CACHE_TTL) {
        const sensitiveWordsRef = collection(db, 'sensitive_words');
        const wordsSnap = await getDocs(sensitiveWordsRef);
        sensitiveWordsCache = wordsSnap.docs.map(doc => doc.data().word);
        lastCacheUpdate = now;
      }
      
      const fullContent = `${data.content} ${data.quote} ${data.nickname}`.toLowerCase();
      for (const word of sensitiveWordsCache) {
        if (fullContent.includes(word.toLowerCase())) {
          throw new Error('CONTENT_SENSITIVE');
        }
      }

      // 2. Save to Firestore
      const bottlesRef = collection(db, 'bottles');
      const docRef = await addDoc(bottlesRef, {
        ...data,
        is_active: true,
        view_count: 0,
        bless_count: 0,
        random_seed: Math.random(), // For random pickup
        created_at: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error casting bottle in Firestore:", error);
      throw error;
    }
  },

  /**
   * Pick up a random bottle
   */
  async pickupBottle(userId: string, targetLang: string): Promise<Bottle | null> {
    try {
      const bottlesRef = collection(db, 'bottles');
      const randomSeed = Math.random();
      
      // Try to find a bottle with random_seed >= randomSeed
      let q = query(
        bottlesRef,
        where('is_active', '==', true),
        where('lang', '==', targetLang),
        orderBy('random_seed'),
        startAt(randomSeed),
        limit(5)
      );

      let querySnapshot = await getDocs(q);
      
      // If no results, wrap around and start from 0
      if (querySnapshot.empty) {
        q = query(
          bottlesRef,
          where('is_active', '==', true),
          where('lang', '==', targetLang),
          orderBy('random_seed'),
          startAt(0),
          limit(5)
        );
        querySnapshot = await getDocs(q);
      }

      const bottles: Bottle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.user_id !== userId) {
          bottles.push({ ...data, id: doc.id } as Bottle);
        }
      });

      if (bottles.length === 0) return null;

      // Pick one from the small batch
      const picked = bottles[Math.floor(Math.random() * bottles.length)];
      
      // Increment view count
      const bottleRef = doc(db, 'bottles', picked.id);
      await updateDoc(bottleRef, {
        view_count: increment(1)
      });

      return picked;
    } catch (error) {
      console.error("Error picking up bottle from Firestore:", error);
      throw error;
    }
  },

  /**
   * Get user's own bottles
   */
  async getMyBottles(userId: string): Promise<Bottle[]> {
    try {
      const bottlesRef = collection(db, 'bottles');
      const q = query(
        bottlesRef,
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bottles: Bottle[] = [];
      
      querySnapshot.forEach((doc) => {
        bottles.push({ ...doc.data(), id: doc.id } as Bottle);
      });
      
      return bottles;
    } catch (error) {
      console.error("Error fetching my bottles from Firestore:", error);
      throw error;
    }
  },

  /**
   * Send a blessing to a bottle
   */
  async sendBlessing(bottleId: string, userId: string, tagId: string): Promise<void> {
    try {
      // 1. Record blessing (optional: check if already blessed)
      const blessingsRef = collection(db, 'bottle_blessings');
      await addDoc(blessingsRef, {
        bottle_id: bottleId,
        user_id: userId,
        tag_id: tagId,
        created_at: serverTimestamp()
      });

      // 2. Update bottle stats
      const bottleRef = doc(db, 'bottles', bottleId);
      const bottleSnap = await getDoc(bottleRef);
      if (!bottleSnap.exists()) return;
      
      const bottleData = bottleSnap.data();
      await updateDoc(bottleRef, {
        bless_count: increment(1)
      });

      // 3. Create notification for owner
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        user_id: bottleData.user_id,
        type: 'resonance',
        title_zh: '妳的瓶子在遠方收到了共鳴',
        title_ja: 'あなたのボトルが遠くで共鳴を受け取りました',
        content_zh: `有人為妳的瓶信送上了祝福`,
        content_ja: `誰かがあなたのボトルに祝福を送りました`,
        is_read: false,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending blessing in Firestore:", error);
      throw error;
    }
  },

  /**
   * Get blessing tags
   */
  async getTags(): Promise<BottleTag[]> {
    try {
      const tagsRef = collection(db, 'bottle_tags');
      const querySnapshot = await getDocs(tagsRef);
      const tags: BottleTag[] = [];
      querySnapshot.forEach((doc) => {
        tags.push({ ...doc.data(), id: doc.id } as BottleTag);
      });
      return tags;
    } catch (error) {
      console.error("Error fetching tags from Firestore:", error);
      throw error;
    }
  }
};
