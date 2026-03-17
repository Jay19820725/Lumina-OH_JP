import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Manifestation, ManifestationDeadlineOption, ManifestationStatus } from '../core/types';

export const manifestationService = {
  /**
   * Get all manifestations for a user
   */
  async getUserManifestations(userId: string): Promise<Manifestation[]> {
    try {
      const manifestationsRef = collection(db, 'manifestations');
      const q = query(
        manifestationsRef,
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const manifestations: Manifestation[] = [];
      
      querySnapshot.forEach((doc) => {
        manifestations.push({ ...doc.data(), id: doc.id } as Manifestation);
      });
      
      return manifestations;
    } catch (error) {
      console.error("Error fetching manifestations from Firestore:", error);
      throw error;
    }
  },

  /**
   * Create a new manifestation
   */
  async createManifestation(
    userId: string, 
    wishTitle: string, 
    deadlineOption: ManifestationDeadlineOption
  ): Promise<string> {
    // Calculate deadline date
    const now = new Date();
    let deadlineDate = new Date();
    switch (deadlineOption) {
      case '1_month':
        deadlineDate.setMonth(now.getMonth() + 1);
        break;
      case '6_months':
        deadlineDate.setMonth(now.getMonth() + 6);
        break;
      case '12_months':
        deadlineDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    try {
      const manifestationsRef = collection(db, 'manifestations');
      const docRef = await addDoc(manifestationsRef, {
        user_id: userId,
        wish_title: wishTitle,
        deadline: deadlineDate.toISOString(),
        deadline_option: deadlineOption,
        status: 'active',
        reminder_sent: false,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating manifestation in Firestore:", error);
      throw error;
    }
  },

  /**
   * Update manifestation status
   */
  async updateStatus(manifestationId: string, status: ManifestationStatus): Promise<void> {
    try {
      const manifestationRef = doc(db, 'manifestations', manifestationId);
      await updateDoc(manifestationRef, { status });
    } catch (error) {
      console.error("Error updating manifestation status in Firestore:", error);
      throw error;
    }
  },

  /**
   * Check for upcoming deadlines
   */
  async checkUpcomingReminders(userId: string): Promise<Manifestation[]> {
    const manifestations = await this.getUserManifestations(userId);
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const upcoming = manifestations.filter(m => {
      if (m.status !== 'active' || m.reminder_sent) return false;
      const deadlineDate = new Date(m.deadline);
      return deadlineDate > now && deadlineDate <= threeDaysFromNow;
    });

    return upcoming;
  },

  /**
   * Mark reminder as sent
   */
  async markReminderSent(manifestationId: string): Promise<void> {
    try {
      const manifestationRef = doc(db, 'manifestations', manifestationId);
      await updateDoc(manifestationRef, { reminder_sent: true });
    } catch (error) {
      console.error("Error marking reminder as sent in Firestore:", error);
      throw error;
    }
  }
};
