import type { HighscoreData } from '../types';
import {
  DEFAULT_HIGHSCORE_DATA,
  serializeHighscoreData,
  deserializeHighscoreData,
} from './serialization';

const STORAGE_KEY = 'pacman-highscore';

/**
 * Checks if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// In-memory fallback when localStorage is not available
let memoryStorage: HighscoreData | null = null;

/**
 * Saves HighscoreData to storage
 */
export function saveHighscoreData(data: HighscoreData): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, serializeHighscoreData(data));
    } catch {
      // Storage full or other error, use memory fallback
      memoryStorage = data;
      console.warn('LocalStorage not available, using in-memory storage');
    }
  } else {
    memoryStorage = data;
  }
}

/**
 * Loads HighscoreData from storage
 * Returns default values if no data exists or data is invalid
 */
export function loadHighscoreData(): HighscoreData {
  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        return { ...DEFAULT_HIGHSCORE_DATA, lastPlayed: new Date().toISOString() };
      }
      return deserializeHighscoreData(stored);
    } catch {
      // Error reading storage
      return { ...DEFAULT_HIGHSCORE_DATA, lastPlayed: new Date().toISOString() };
    }
  }
  
  // Use memory fallback
  return memoryStorage ?? { ...DEFAULT_HIGHSCORE_DATA, lastPlayed: new Date().toISOString() };
}

/**
 * Clears stored highscore data
 */
export function clearHighscoreData(): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
  memoryStorage = null;
}
