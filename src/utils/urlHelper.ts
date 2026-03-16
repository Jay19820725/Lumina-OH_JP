/**
 * Firebase Storage URL Helper
 */

const FIREBASE_STORAGE_BUCKET = 'yuni-8f439.firebasestorage.app';
const ASSETS_PREFIX = 'eunie-assets';

/**
 * Converts a relative path from the database to a full Firebase Storage URL
 * @param relativePath Example: "cards/tw/image/img_01.jpeg"
 * @returns Full URL with alt=media
 */
export function getFullStorageUrl(relativePath: string): string {
  if (!relativePath) return '';
  
  // If it's already a full URL, return it
  if (relativePath.startsWith('http')) return relativePath;

  // Ensure we don't have double slashes if the path starts with one
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  const fullPath = `${ASSETS_PREFIX}/${cleanPath}`;
  
  // Firebase Storage URL format: 
  // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[ENCODED_PATH]?alt=media
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(fullPath)}?alt=media`;
}

/**
 * Strips the Firebase Storage prefix to get the relative path for database storage
 * @param fullUrl Full URL or relative path
 * @returns Relative path starting with "cards/..."
 */
export function getRelativePath(fullUrl: string): string {
  if (!fullUrl) return '';
  if (!fullUrl.startsWith('http')) return fullUrl;

  try {
    const url = new URL(fullUrl);
    if (url.hostname === 'firebasestorage.googleapis.com') {
      const pathParts = url.pathname.split('/o/');
      if (pathParts.length > 1) {
        let decodedPath = decodeURIComponent(pathParts[1]);
        // Remove prefix if it exists
        if (decodedPath.startsWith(`${ASSETS_PREFIX}/`)) {
          return decodedPath.substring(ASSETS_PREFIX.length + 1);
        }
        return decodedPath;
      }
    }
  } catch (e) {
    console.error('Error parsing URL in getRelativePath:', e);
  }
  
  return fullUrl;
}
