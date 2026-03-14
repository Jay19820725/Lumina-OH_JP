import { Manifestation, ManifestationDeadlineOption, ManifestationStatus } from '../core/types';

export const manifestationService = {
  /**
   * Get all manifestations for a user
   */
  async getUserManifestations(userId: string): Promise<Manifestation[]> {
    const response = await fetch(`/api/manifestations/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch manifestations');
    }
    const data = await response.json();
    return data as Manifestation[];
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

    const response = await fetch('/api/manifestations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        wish_title: wishTitle,
        deadline: deadlineDate.toISOString(),
        deadline_option: deadlineOption,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create manifestation');
    }

    const result = await response.json();
    return result.id;
  },

  /**
   * Update manifestation status
   */
  async updateStatus(manifestationId: string, status: ManifestationStatus): Promise<void> {
    const response = await fetch(`/api/manifestations/${manifestationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update manifestation status');
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
    const response = await fetch(`/api/manifestations/${manifestationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reminder_sent: true }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark reminder as sent');
    }
  }
};
