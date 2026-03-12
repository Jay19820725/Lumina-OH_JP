import { ImageCard, WordCard, SelectedCards } from '../core/types';

/**
 * JDear Card Draw Engine
 * Role: Senior Frontend Engineer
 * 
 * Implements secure random selection from JSON collections.
 * Supports multi-language (zh-TW, ja-JP) and dynamic asset loading.
 */

// In-memory cache to avoid redundant reads during a single session, indexed by locale
const imageDeckCache: Record<string, ImageCard[]> = {};
const wordDeckCache: Record<string, WordCard[]> = {};

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
 * Maps app language to database locale
 */
function getDbLocale(language: string): string {
  return language === 'ja' ? 'ja-JP' : 'zh-TW';
}

/**
 * Fetches card data from backend API
 */
async function fetchCardData(language: string, type: 'img' | 'word'): Promise<any[]> {
  const lang = getDbLocale(language);
  const endpoint = type === 'img' ? '/api/cards/image' : '/api/cards/word';
  try {
    const response = await fetch(`${endpoint}?lang=${lang}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} cards`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${type} cards for ${language}:`, error);
    return [];
  }
}

/**
 * 1. drawCardImage function
 */
export async function drawCardImage(count: number = 3, language: string = 'zh'): Promise<ImageCard[]> {
  if (!imageDeckCache[language]) {
    const rawData = await fetchCardData(language, 'img');
    imageDeckCache[language] = rawData.map(item => ({
      id: item.id,
      imageUrl: item.imageUrl || item.image_url,
      description: item.description,
      elements: item.elements,
      lang: item.lang,
      keywords: item.keywords
    } as ImageCard));
  }

  const shuffled = secureShuffle(imageDeckCache[language]);
  return shuffled.slice(0, count);
}

/**
 * 2. drawCardWord function
 */
export async function drawCardWord(count: number = 3, language: string = 'zh'): Promise<WordCard[]> {
  if (!wordDeckCache[language]) {
    const rawData = await fetchCardData(language, 'word');
    wordDeckCache[language] = rawData.map(item => ({
      id: item.id,
      text: item.text,
      imageUrl: item.imageUrl || item.image_url,
      description: item.description,
      elements: item.elements,
      lang: item.lang,
      keywords: item.keywords
    } as WordCard));
  }

  const shuffled = secureShuffle(wordDeckCache[language]);
  return shuffled.slice(0, count);
}

/**
 * Pre-fetches both image and word decks for a specific language
 */
export async function preloadDecks(language: string = 'zh'): Promise<void> {
  await Promise.all([
    drawCardImage(0, language),
    drawCardWord(0, language)
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
export async function performJDearDraw(language: string = 'zh'): Promise<SelectedCards> {
  const [images, words] = await Promise.all([
    drawCardImage(3, language),
    drawCardWord(3, language)
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
export function clearDeckCache(language?: string) {
  if (language) {
    delete imageDeckCache[language];
    delete wordDeckCache[language];
  } else {
    // Clear all
    Object.keys(imageDeckCache).forEach(key => delete imageDeckCache[key]);
    Object.keys(wordDeckCache).forEach(key => delete wordDeckCache[key]);
  }
}

