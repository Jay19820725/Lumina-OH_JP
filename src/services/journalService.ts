import { EnergyJournalEntry, EmotionTag } from '../core/types';

/**
 * journalService
 * 
 * Handles operations for the Energy Journal using the PostgreSQL-backed API.
 */
export const journalService = {
  /**
   * Add a new journal entry
   */
  async addEntry(userId: string, data: { emotion_tag: EmotionTag; insight: string; intention: string }): Promise<string> {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          emotion_tag: data.emotion_tag,
          insight: data.insight,
          intention: data.intention,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add journal entry');
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error("Error adding journal entry:", error);
      throw error;
    }
  },

  /**
   * Get journal entries for a user
   */
  async getEntries(userId: string, maxEntries: number = 50): Promise<EnergyJournalEntry[]> {
    try {
      const response = await fetch(`/api/journal/${userId}?limit=${maxEntries}`);

      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }

      const entries = await response.json();
      return entries.map((entry: any) => ({
        ...entry,
        date: entry.date ? { toDate: () => new Date(entry.date) } : null, // Mock Firestore Timestamp for compatibility
      })) as EnergyJournalEntry[];
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      throw error;
    }
  },

  /**
   * Delete a journal entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const response = await fetch(`/api/journal/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      throw error;
    }
  }
};
