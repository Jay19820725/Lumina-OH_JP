import { User } from 'firebase/auth';
import { UserProfile, UserRole } from '../core/types';

/**
 * userService
 * 
 * Handles operations for user profiles using the PostgreSQL-backed API.
 */
export const userService = {
  /**
   * Get or create user profile in PostgreSQL
   */
  async getOrCreateProfile(user: User): Promise<UserProfile> {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get or create user profile');
      }

      const profile = await response.json();
      return {
        ...profile,
        displayName: profile.display_name,
        photoURL: profile.photo_url,
        settings: profile.settings || { daily_reminder: false, dark_mode: false, newsletter: false }
      } as UserProfile;
    } catch (error: any) {
      console.error("Failed to fetch user profile from API:", error);
      
      // Fallback for offline mode or network issues
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Guest',
        photoURL: user.photoURL || '',
        role: 'free_member',
        register_date: new Date().toISOString(),
        subscription_status: 'none',
        last_login: new Date().toISOString(),
        settings: { daily_reminder: false, dark_mode: false, newsletter: false }
      } as UserProfile;
    }
  },

  /**
   * Get user profile by UID
   */
  async getProfile(uid: string): Promise<UserProfile> {
    const response = await fetch(`/api/users/${uid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const profile = await response.json();
    return {
      ...profile,
      displayName: profile.display_name,
      photoURL: profile.photo_url,
      settings: profile.settings || { daily_reminder: false, dark_mode: false, newsletter: false }
    } as UserProfile;
  },

  /**
   * Update user role
   */
  async updateRole(uid: string, role: UserRole): Promise<UserProfile> {
    const response = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Server returned non-JSON response:", text);
      throw new Error(`伺服器錯誤 (${response.status}): 傳回了非 JSON 格式的回應。`);
    }

    if (!response.ok) {
      throw new Error(data.error || `更新失敗 (${response.status})`);
    }
    
    return {
      ...data,
      displayName: data.display_name,
      photoURL: data.photo_url,
      settings: data.settings || { daily_reminder: false, dark_mode: false, newsletter: false }
    } as UserProfile;
  },

  /**
   * Update user profile fields (displayName, photoURL, etc.)
   */
  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update profile');
    }

    const data = await response.json();
    return {
      ...data,
      displayName: data.display_name,
      photoURL: data.photo_url,
      settings: data.settings
    } as UserProfile;
  },

  /**
   * Update user settings
   */
  async updateSettings(uid: string, settings: UserProfile['settings']): Promise<UserProfile> {
    const response = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update settings');
    }

    const data = await response.json();
    return {
      ...data,
      displayName: data.display_name,
      photoURL: data.photo_url,
      settings: data.settings
    } as UserProfile;
  },

  /**
   * Update subscription status
   */
  async updateSubscription(uid: string, status: 'active' | 'inactive' | 'none'): Promise<void> {
    const response = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        subscription_status: status
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }
  }
};
