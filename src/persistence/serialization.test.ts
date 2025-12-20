import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  DEFAULT_HIGHSCORE_DATA,
  isValidHighscoreData,
  serializeHighscoreData,
  deserializeHighscoreData,
  updateHighscore,
  toggleSound,
} from './serialization';
import type { HighscoreData } from '../types';

describe('serialization', () => {
  describe('isValidHighscoreData', () => {
    it('should return true for valid data', () => {
      const validData: HighscoreData = {
        version: 1,
        highscore: 1000,
        lastPlayed: '2024-01-01T00:00:00.000Z',
        settings: { soundEnabled: true },
      };
      expect(isValidHighscoreData(validData)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidHighscoreData(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidHighscoreData('string')).toBe(false);
      expect(isValidHighscoreData(123)).toBe(false);
    });

    it('should return false for invalid version', () => {
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, version: 0 })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, version: -1 })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, version: 'v1' })).toBe(false);
    });

    it('should return false for invalid highscore', () => {
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, highscore: -1 })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, highscore: 'high' })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, highscore: Infinity })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, highscore: NaN })).toBe(false);
    });

    it('should return false for invalid lastPlayed', () => {
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, lastPlayed: 'not-a-date' })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, lastPlayed: 123 })).toBe(false);
    });

    it('should return false for invalid settings', () => {
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, settings: null })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, settings: {} })).toBe(false);
      expect(isValidHighscoreData({ ...DEFAULT_HIGHSCORE_DATA, settings: { soundEnabled: 'yes' } })).toBe(false);
    });
  });

  describe('serializeHighscoreData', () => {
    it('should serialize to valid JSON', () => {
      const data: HighscoreData = {
        version: 1,
        highscore: 5000,
        lastPlayed: '2024-06-15T12:00:00.000Z',
        settings: { soundEnabled: false },
      };
      const json = serializeHighscoreData(data);
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('deserializeHighscoreData', () => {
    it('should deserialize valid JSON', () => {
      const original: HighscoreData = {
        version: 1,
        highscore: 5000,
        lastPlayed: '2024-06-15T12:00:00.000Z',
        settings: { soundEnabled: false },
      };
      const json = JSON.stringify(original);
      const result = deserializeHighscoreData(json);
      expect(result).toEqual(original);
    });

    it('should return defaults for invalid JSON', () => {
      const result = deserializeHighscoreData('not valid json');
      expect(result.version).toBe(SCHEMA_VERSION);
      expect(result.highscore).toBe(0);
      expect(result.settings.soundEnabled).toBe(true);
    });

    it('should return defaults for invalid schema', () => {
      const result = deserializeHighscoreData('{"foo": "bar"}');
      expect(result.version).toBe(SCHEMA_VERSION);
      expect(result.highscore).toBe(0);
    });
  });

  describe('updateHighscore', () => {
    it('should update highscore when new score is higher', () => {
      const current: HighscoreData = {
        version: 1,
        highscore: 1000,
        lastPlayed: '2024-01-01T00:00:00.000Z',
        settings: { soundEnabled: true },
      };
      const updated = updateHighscore(current, 2000);
      expect(updated.highscore).toBe(2000);
    });

    it('should keep current highscore when new score is lower', () => {
      const current: HighscoreData = {
        version: 1,
        highscore: 5000,
        lastPlayed: '2024-01-01T00:00:00.000Z',
        settings: { soundEnabled: true },
      };
      const updated = updateHighscore(current, 2000);
      expect(updated.highscore).toBe(5000);
    });

    it('should update lastPlayed timestamp', () => {
      const current: HighscoreData = {
        version: 1,
        highscore: 1000,
        lastPlayed: '2020-01-01T00:00:00.000Z',
        settings: { soundEnabled: true },
      };
      const updated = updateHighscore(current, 500);
      expect(new Date(updated.lastPlayed).getTime()).toBeGreaterThan(
        new Date(current.lastPlayed).getTime()
      );
    });
  });

  describe('toggleSound', () => {
    it('should toggle sound from true to false', () => {
      const current: HighscoreData = {
        version: 1,
        highscore: 1000,
        lastPlayed: '2024-01-01T00:00:00.000Z',
        settings: { soundEnabled: true },
      };
      const toggled = toggleSound(current);
      expect(toggled.settings.soundEnabled).toBe(false);
    });

    it('should toggle sound from false to true', () => {
      const current: HighscoreData = {
        version: 1,
        highscore: 1000,
        lastPlayed: '2024-01-01T00:00:00.000Z',
        settings: { soundEnabled: false },
      };
      const toggled = toggleSound(current);
      expect(toggled.settings.soundEnabled).toBe(true);
    });

    it('should preserve other fields', () => {
      const current: HighscoreData = {
        version: 1,
        highscore: 5000,
        lastPlayed: '2024-01-01T00:00:00.000Z',
        settings: { soundEnabled: true },
      };
      const toggled = toggleSound(current);
      expect(toggled.version).toBe(current.version);
      expect(toggled.highscore).toBe(current.highscore);
      expect(toggled.lastPlayed).toBe(current.lastPlayed);
    });
  });
});
