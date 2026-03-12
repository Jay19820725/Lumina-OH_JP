import { drawCardImage, drawCardWord } from './cardEngine';
import { ImageCard, WordCard, CardPair } from '../core/types';

/**
 * drawSession function
 * 
 * Creates a new session using the PostgreSQL-backed API.
 */
export async function drawSession(userId: string): Promise<{ sessionId: string; imageCards: ImageCard[]; wordCards: WordCard[] }> {
  // 1. Draw 6 random image cards
  const imageCards = await drawCardImage(6);
  
  // 2. Draw 6 random word cards
  const wordCards = await drawCardWord(6);
  
  // 3. Create session via API
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        image_cards: imageCards,
        word_cards: wordCards,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const result = await response.json();
    
    return {
      sessionId: result.id,
      imageCards,
      wordCards
    };
  } catch (error) {
    console.error("Error creating draw session:", error);
    throw error;
  }
}

/**
 * updateSession function
 * 
 * Updates an existing session using the PostgreSQL-backed API.
 */
export async function updateSession(sessionId: string, pairs: CardPair[]): Promise<void> {
  // Extract association texts as requested
  const associationTexts = pairs.map(p => p.association || '').slice(0, 3);
  
  // Ensure we only store up to 3 pairs
  const finalPairs = pairs.slice(0, 3);

  try {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pairs: finalPairs,
        association_text: associationTexts
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update session');
    }
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
}
