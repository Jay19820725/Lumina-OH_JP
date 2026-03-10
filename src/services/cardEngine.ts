import { ImageCard, WordCard, SelectedCards } from '../core/types';
import { WORDS, IMAGES } from '../core/cards';

/**
 * JDear Card Draw Engine
 * Role: Senior Frontend Engineer
 * 
 * Implements secure random selection from PostgreSQL collections.
 * Prevents duplicates and ensures separate deck logic.
 */

// In-memory cache to avoid redundant reads during a single session
let imageDeckCache: ImageCard[] | null = null;
let wordDeckCache: WordCard[] | null = null;

/**
 * Securely shuffles an array using the Fisher-Yates algorithm and Web Crypto API.
 */
function secureShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 1. drawCardImage function
 */
export async function drawCardImage(count: number = 3): Promise<ImageCard[]> {
  if (!imageDeckCache) {
    imageDeckCache = IMAGES.map(img => ({
      id: `local-img-${img.id}`,
      imageUrl: `https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/oh-cards%2Fimg_${img.id.toString().padStart(2, '0')}.jpeg?alt=media`,
      description: img.description,
      elements: { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 }
    } as ImageCard));

    syncImageDeck();
  }

  const shuffled = secureShuffle(imageDeckCache!);
  return shuffled.slice(0, count);
}

let isSyncingImages = false;
let isSyncingWords = false;

/**
 * Background sync for image deck
 */
async function syncImageDeck() {
  if (isSyncingImages) return;
  isSyncingImages = true;
  try {
    const response = await fetch('/api/cards/image');
    if (response.ok) {
      const cards = await response.json();
      if (cards.length > 0) {
        imageDeckCache = cards.map((data: any) => ({
          id: data.id,
          imageUrl: data.image_url,
          description: data.description || '',
          elements: data.elements
        } as ImageCard));
      }
    }
  } catch (error) {
    console.error('Background sync failed for Image deck:', error);
  } finally {
    isSyncingImages = false;
  }
}

/**
 * 2. drawCardWord function
 */
export async function drawCardWord(count: number = 3): Promise<WordCard[]> {
  if (!wordDeckCache) {
    wordDeckCache = WORDS.map(word => ({
      id: `local-word-${word.id}`,
      text: word.text,
      imageUrl: `https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/oh-cards%2Fword_${word.id.toString().padStart(2, '0')}.jpeg?alt=media`,
      description: word.text,
      elements: {
        wood: word.wood,
        fire: word.fire,
        earth: word.earth,
        metal: word.metal,
        water: word.water
      }
    } as WordCard));

    syncWordDeck();
  }

  const shuffled = secureShuffle(wordDeckCache!);
  return shuffled.slice(0, count);
}

/**
 * Background sync for word deck
 */
async function syncWordDeck() {
  if (isSyncingWords) return;
  isSyncingWords = true;
  try {
    const response = await fetch('/api/cards/word');
    if (response.ok) {
      const cards = await response.json();
      if (cards.length > 0) {
        wordDeckCache = cards.map((data: any) => ({
          id: data.id,
          text: data.text || '',
          imageUrl: data.image_url,
          description: data.description || data.text || '',
          elements: data.elements
        } as WordCard));
      }
    }
  } catch (error) {
    console.error('Background sync failed for Word deck:', error);
  } finally {
    isSyncingWords = false;
  }
}

/**
 * Pre-fetches both image and word decks
 */
export async function preloadDecks(): Promise<void> {
  await Promise.all([
    drawCardImage(0),
    drawCardWord(0)
  ]);
}

/**
 * Preloads specific images into the browser cache.
 */
function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

/**
 * 3. Random Selection Logic (Main Entry Point)
 */
export async function performJDearDraw(): Promise<SelectedCards> {
  const [images, words] = await Promise.all([
    drawCardImage(3),
    drawCardWord(3)
  ]);

  const imageUrls = [
    ...images.map(img => img.imageUrl),
    ...words.map(w => w.imageUrl)
  ];
  
  preloadImages(imageUrls);

  return {
    images,
    words,
    drawnAt: Date.now()
  };
}

/**
 * Utility to clear cache if a fresh deck fetch is required.
 */
export function clearDeckCache() {
  imageDeckCache = null;
  wordDeckCache = null;
}
