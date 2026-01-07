import { CheatSheetSection } from '../types';

interface CacheEntry {
  fileHash: string;
  filename: string;
  content: CheatSheetSection[];
  timestamp: number;
  fileSize: number;
}

const CACHE_KEY_PREFIX = 'ai_arena_cache_';
const CACHE_METADATA_KEY = 'ai_arena_cache_metadata';

/**
 * Generate a simple hash from file content for caching
 * Uses a basic approach: combine file name, size, and first/last 100 chars
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.slice(0, 1000).arrayBuffer();
  const arr = new Uint8Array(buffer);
  let hash = file.name + file.size;
  
  for (let i = 0; i < arr.length; i++) {
    hash += arr[i].toString(16);
  }
  
  // Simple hash function
  return 'hash_' + btoa(hash).substring(0, 32);
};

export const cacheCheatSheet = (
  fileHash: string,
  filename: string,
  content: CheatSheetSection[],
  fileSize: number
): void => {
  try {
    const cacheEntry: CacheEntry = {
      fileHash,
      filename,
      content,
      timestamp: Date.now(),
      fileSize,
    };

    // Store in localStorage
    localStorage.setItem(CACHE_KEY_PREFIX + fileHash, JSON.stringify(cacheEntry));

    // Update metadata (track all cached hashes for cleanup)
    const metadata = JSON.parse(localStorage.getItem(CACHE_METADATA_KEY) || '{}');
    metadata[fileHash] = {
      filename,
      timestamp: Date.now(),
      size: JSON.stringify(cacheEntry).length,
    };
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Cache storage failed (quota exceeded?):', error);
  }
};

export const getCachedCheatSheet = (fileHash: string): CheatSheetSection[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + fileHash);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    return entry.content;
  } catch (error) {
    console.warn('Cache retrieval failed:', error);
    return null;
  }
};

export const getCacheMetadata = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_METADATA_KEY) || '{}');
  } catch {
    return {};
  }
};

/**
 * Get total cache size in KB
 */
export const getCacheSizeKB = (): number => {
  try {
    const metadata = getCacheMetadata();
    let totalSize = 0;
    
    Object.values(metadata).forEach((entry: any) => {
      totalSize += entry.size || 0;
    });

    return Math.round(totalSize / 1024);
  } catch {
    return 0;
  }
};

/**
 * Clear all cached cheat sheets
 */
export const clearAllCache = (): void => {
  try {
    const metadata = getCacheMetadata();
    Object.keys(metadata).forEach(hash => {
      localStorage.removeItem(CACHE_KEY_PREFIX + hash);
    });
    localStorage.removeItem(CACHE_METADATA_KEY);
  } catch (error) {
    console.warn('Cache clear failed:', error);
  }
};

/**
 * Clear cache older than X days
 */
export const clearOldCache = (daysOld: number = 7): number => {
  try {
    const metadata = getCacheMetadata();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    Object.entries(metadata).forEach(([hash, entry]: [string, any]) => {
      if (entry.timestamp < cutoffTime) {
        localStorage.removeItem(CACHE_KEY_PREFIX + hash);
        delete metadata[hash];
        deletedCount++;
      }
    });

    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    return deletedCount;
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
    return 0;
  }
};
