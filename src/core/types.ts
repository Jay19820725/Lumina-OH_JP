/**
 * Core type definitions for JDear
 */

export enum FiveElement {
  WOOD = 'wood',
  FIRE = 'fire',
  EARTH = 'earth',
  METAL = 'metal',
  WATER = 'water'
}

export interface FiveElementValues {
  [FiveElement.WOOD]: number;
  [FiveElement.FIRE]: number;
  [FiveElement.EARTH]: number;
  [FiveElement.METAL]: number;
  [FiveElement.WATER]: number;
}

export interface ImageCard {
  id: string;
  imageUrl: string;
  elements: FiveElementValues;
  description?: string;
  lang?: string;
  keywords?: string[];
  metadata?: {
    artist?: string;
    series?: string;
  };
}

export interface WordCard {
  id: string;
  text: string;
  imageUrl: string;
  elements: FiveElementValues;
  description?: string;
  lang?: string;
  keywords?: string[];
  metadata?: {
    language?: string;
    category?: string;
  };
}

export interface CardPair {
  image: ImageCard;
  word: WordCard;
  association?: string;
}

export interface SelectedCards {
  sessionId?: string;
  images: ImageCard[];
  words: WordCard[];
  pairs?: CardPair[];
  drawnAt: number;
}

export interface AnalysisReport {
  id: string;
  userId?: string;
  timestamp: number;
  selectedImageIds: string[];
  selectedWordIds: string[];
  totalScores: FiveElementValues; // Normalized percentages
  dominantElement: string;
  weakElement: string;
  balanceScore: number;
  interpretation?: string;
  pairInterpretations?: { pair_id: string; text: string }[];
  pairs?: CardPair[];
  
  // AI Analysis Sections
  todayTheme?: string;
  cardInterpretation?: string;
  psychologicalInsight?: string;
  fiveElementAnalysis?: string;
  reflection?: string;
  actionSuggestion?: string;
  shareThumbnail?: string;
  
  // Legacy fields (keep for backward compatibility if needed, but we'll use new ones)
  psychologicalReflection?: string;
  energyAdvice?: string;
  
  isGuest?: boolean;
  isAiComplete?: boolean;
}

export type UserRole = 'guest' | 'free_member' | 'premium_member' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  register_date: any; // Firestore timestamp
  subscription_status: 'active' | 'inactive' | 'none';
  last_login?: any;
  settings?: {
    daily_reminder: boolean;
    dark_mode: boolean;
    newsletter: boolean;
  };
}

export interface Session {
  id: string;
  user_id: string;
  session_time: any; // Firestore timestamp
  image_cards: ImageCard[];
  word_cards: WordCard[];
  pairs: CardPair[];
  association_text: string[];
}

export type EmotionTag = 'calm' | 'anxious' | 'inspired' | 'tired';

export type ManifestationStatus = 'active' | 'completed' | 'cancelled' | 'expired';
export type ManifestationDeadlineOption = '1_month' | '6_months' | '12_months';

export interface Manifestation {
  id?: string;
  user_id: string;
  wish_title: string;
  deadline: any; // Firestore timestamp
  deadline_option: ManifestationDeadlineOption;
  status: ManifestationStatus;
  created_at: any;
  reminder_sent?: boolean;
}

export interface EnergyJournalEntry {
  id?: string;
  user_id: string;
  date: any; // Firestore timestamp
  emotion_tag: EmotionTag;
  insight: string;
  intention: string;
  created_at: any;
}

export interface AIPrompt {
  id: string;
  prompt_name: string;
  prompt_content: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  category: 'analysis' | 'daily' | 'manifestation' | 'persona';
  lang: 'zh-TW' | 'ja-JP';
  is_default: boolean;
  created_at: any;
  updated_at: any;
  ab_test_group?: 'A' | 'B' | 'control';
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  google_analytics_id: string;
  search_console_id: string;
  index_enabled: boolean;
}

export interface SiteSettings {
  key: string;
  value: any;
  updated_at: any;
}
