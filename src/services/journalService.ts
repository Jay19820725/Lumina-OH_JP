import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EnergyJournalEntry, EmotionTag } from '../core/types';

/**
 * journalService
 * 
 * Handles operations for the Energy Journal using Firebase Firestore.
 */
export const journalService = {
  /**
   * Add a new journal entry
   */
  async addEntry(userId: string, data: { emotion_tag: EmotionTag; insight: string; intention: string }): Promise<string> {
    try {
      const journalRef = collection(db, 'energy_journal');
      const docRef = await addDoc(journalRef, {
        user_id: userId,
        emotion_tag: data.emotion_tag,
        insight: data.insight,
        intention: data.intention,
        date: new Date().toISOString(),
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding journal entry to Firestore:", error);
      throw error;
    }
  },

  /**
   * Get journal entries for a user
   */
  async getEntries(userId: string, maxEntries: number = 50): Promise<EnergyJournalEntry[]> {
    try {
      const journalRef = collection(db, 'energy_journal');
      const q = query(
        journalRef,
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(maxEntries)
      );

      const querySnapshot = await getDocs(q);
      const entries: EnergyJournalEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          ...data,
          id: doc.id,
          date: data.date || data.created_at?.toDate()?.toISOString() || new Date().toISOString()
        } as EnergyJournalEntry);
      });
      
      return entries;
    } catch (error) {
      console.error("Error fetching journal entries from Firestore:", error);
      throw error;
    }
  },

  /**
   * Delete a journal entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const entryRef = doc(db, 'energy_journal', entryId);
      await deleteDoc(entryRef);
    } catch (error) {
      console.error("Error deleting journal entry from Firestore:", error);
      throw error;
    }
  }
};
