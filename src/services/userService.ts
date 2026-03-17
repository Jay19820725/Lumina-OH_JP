import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../core/types';

/**
 * userService
 * 
 * Handles operations for user profiles using Firebase Firestore.
 */
export const userService = {
  /**
   * Get or create user profile in Firestore
   */
  async getOrCreateProfile(user: User): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          uid: user.uid,
          displayName: data.display_name || data.displayName,
          photoURL: data.photo_url || data.photoURL,
        } as UserProfile;
      } else {
        // Create new profile
        const newProfile: any = {
          uid: user.uid,
          email: user.email || '',
          display_name: user.displayName || 'Guest',
          photo_url: user.photoURL || '',
          role: 'free_member',
          register_date: new Date().toISOString(),
          subscription_status: 'none',
          last_login: new Date().toISOString(),
          settings: { daily_reminder: false, dark_mode: false, newsletter: false }
        };
        
        await setDoc(userRef, newProfile);
        
        return {
          ...newProfile,
          displayName: newProfile.display_name,
          photoURL: newProfile.photo_url,
        } as UserProfile;
      }
    } catch (error: any) {
      console.error("Failed to fetch user profile from Firestore:", error);
      
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
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User profile not found');
    }
    
    const data = userSnap.data();
    return {
      ...data,
      uid: uid,
      displayName: data.display_name || data.displayName,
      photoURL: data.photo_url || data.photoURL,
    } as UserProfile;
  },

  /**
   * Update user role
   */
  async updateRole(uid: string, role: UserRole): Promise<UserProfile> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
    return this.getProfile(uid);
  },

  /**
   * Update user profile fields (displayName, photoURL, etc.)
   */
  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const userRef = doc(db, 'users', uid);
    
    // Map camelCase to snake_case for Firestore consistency if needed
    const firestoreUpdates: any = { ...updates };
    if (updates.displayName) firestoreUpdates.display_name = updates.displayName;
    if (updates.photoURL) firestoreUpdates.photo_url = updates.photoURL;
    
    await updateDoc(userRef, firestoreUpdates);
    return this.getProfile(uid);
  },

  /**
   * Update user settings
   */
  async updateSettings(uid: string, settings: UserProfile['settings']): Promise<UserProfile> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { settings });
    return this.getProfile(uid);
  },

  /**
   * Update subscription status
   */
  async updateSubscription(uid: string, status: 'active' | 'inactive' | 'none'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { subscription_status: status });
  }
};
