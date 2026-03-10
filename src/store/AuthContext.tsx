import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { UserProfile } from '../core/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await userService.getProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error("AuthContext: Failed to refresh profile:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Start fetching profile but don't block the UI if we already have basic user info
        try {
          const userProfile = await userService.getOrCreateProfile(firebaseUser);
          setProfile(userProfile);
        } catch (error) {
          console.error("AuthContext: Failed to fetch profile:", error);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    // Prompt the user to select an account
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      console.log("AuthContext: Starting Google Login...");
      const result = await signInWithPopup(auth, provider);
      console.log("AuthContext: Login successful for:", result.user.email);
    } catch (error: any) {
      console.error("AuthContext: Login failed:", error);
      
      let errorMessage = "登入失敗，請稍後再試。";
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "登入視窗被瀏覽器攔截，請允許彈出視窗後再試一次。";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "登入視窗已被關閉。";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "此網域未經授權，請聯絡管理員將此網域加入 Firebase 授權清單。";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google 登入功能未在 Firebase Console 中啟用。";
      }
      
      alert(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("AuthContext: Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
