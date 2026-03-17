import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { drawCardImage, drawCardWord } from './cardEngine';
import { ImageCard, WordCard, CardPair } from '../core/types';

/**
 * drawSession function
 * 
 * Creates a new session using Firebase Firestore.
 */
export async function drawSession(userId: string, language: string = 'zh'): Promise<{ sessionId: string; imageCards: ImageCard[]; wordCards: WordCard[] }> {
  // 1. Draw 3 random image cards
  const imageCards = await drawCardImage(3, language);
  
  // 2. Draw 3 random word cards
  const wordCards = await drawCardWord(3, language);
  
  // 3. Create session via Firestore
  try {
    const sessionsRef = collection(db, 'sessions');
    const docRef = await addDoc(sessionsRef, {
      user_id: userId,
      session_time: new Date().toISOString(),
      image_cards: imageCards,
      word_cards: wordCards,
      pairs: [],
      association_text: [],
      created_at: serverTimestamp()
    });
    
    return {
      sessionId: docRef.id,
      imageCards,
      wordCards
    };
  } catch (error) {
    console.error("Error creating draw session in Firestore:", error);
    throw error;
  }
}

/**
 * updateSession function
 * 
 * Updates an existing session using Firebase Firestore.
 */
export async function updateSession(sessionId: string, pairs: CardPair[]): Promise<void> {
  // Extract association texts as requested
  const associationTexts = pairs.map(p => p.association || '').slice(0, 3);
  
  // Ensure we only store up to 3 pairs
  const finalPairs = pairs.slice(0, 3);

  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      pairs: finalPairs,
      association_text: associationTexts
    });
  } catch (error) {
    console.error("Error updating session in Firestore:", error);
    throw error;
  }
}
