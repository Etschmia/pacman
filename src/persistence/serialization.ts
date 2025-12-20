import type { HighscoreData } from '../types';

// Current schema version
export const SCHEMA_VERSION = 1;

// Default values for HighscoreData
export const DEFAULT_HIGHSCORE_DATA: HighscoreData = {
  version: SCHEMA_VERSION,
  highscore: 0,
  lastPlayed: new Date().toISOString(),
  settings: {
    soundEnabled: true,
  },
};

/**
 * Validates that a value is a valid HighscoreData object
 */
export function isValidHighscoreData(data: unknown): data is HighscoreData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (typeof obj.version !== 'number' || obj.version < 1) {
    return false;
  }

  // Check highscore
  if (typeof obj.highscore !== 'number' || obj.highscore < 0 || !Number.isFinite(obj.highscore)) {
    return false;
  }

  // Check lastPlayed (ISO 8601 date string)
  if (typeof obj.lastPlayed !== 'string') {
    return false;
  }
  const date = new Date(obj.lastPlayed);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check settings
  if (typeof obj.settings !== 'object' || obj.settings === null) {
    return false;
  }
  const settings = obj.settings as Record<string, unknown>;
  if (typeof settings.soundEnabled !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Serializes HighscoreData to JSON string
 */
export function serializeHighscoreData(data: HighscoreData): string {
  return JSON.stringify(data);
}

/**
 * Deserializes JSON string to HighscoreData with validation
 * Returns default values if data is invalid
 */
export function deserializeHighscoreData(json: string): HighscoreData {
  try {
    const parsed = JSON.parse(json);
    
    if (isValidHighscoreData(parsed)) {
      return parsed;
    }
    
    // Invalid schema, return defaults
    return { ...DEFAULT_HIGHSCORE_DATA, lastPlayed: new Date().toISOString() };
  } catch {
    // JSON parse error, return defaults
    return { ...DEFAULT_HIGHSCORE_DATA, lastPlayed: new Date().toISOString() };
  }
}

/**
 * Creates a new HighscoreData with updated highscore
 */
export function updateHighscore(current: HighscoreData, newScore: number): HighscoreData {
  return {
    ...current,
    highscore: Math.max(current.highscore, newScore),
    lastPlayed: new Date().toISOString(),
  };
}

/**
 * Creates a new HighscoreData with toggled sound setting
 */
export function toggleSound(current: HighscoreData): HighscoreData {
  return {
    ...current,
    settings: {
      ...current.settings,
      soundEnabled: !current.settings.soundEnabled,
    },
  };
}
