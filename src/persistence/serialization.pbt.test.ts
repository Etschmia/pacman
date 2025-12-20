import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PBT_CONFIG, highscoreDataArb, scoreArb } from '../test/pbt-config';
import {
  serializeHighscoreData,
  deserializeHighscoreData,
  isValidHighscoreData,
  DEFAULT_HIGHSCORE_DATA,
  SCHEMA_VERSION,
} from './serialization';
import type { HighscoreData } from '../types';

describe('serialization property-based tests', () => {
  /**
   * **Feature: pacman-clone, Property 18: Highscore-Round-Trip**
   * **Validates: Requirements 12.1, 12.2, 12.4**
   * 
   * *Für jeden* gültigen Highscore-Wert, wenn er serialisiert und dann 
   * deserialisiert wird, soll der resultierende Wert identisch zum ursprünglichen sein.
   */
  it('Property 18: Highscore-Round-Trip - serialize then deserialize produces identical data', () => {
    fc.assert(
      fc.property(highscoreDataArb, (data: HighscoreData) => {
        const serialized = serializeHighscoreData(data);
        const deserialized = deserializeHighscoreData(serialized);
        
        expect(deserialized.version).toBe(data.version);
        expect(deserialized.highscore).toBe(data.highscore);
        expect(deserialized.lastPlayed).toBe(data.lastPlayed);
        expect(deserialized.settings.soundEnabled).toBe(data.settings.soundEnabled);
      }),
      PBT_CONFIG
    );
  });

  /**
   * **Feature: pacman-clone, Property 19: Schema-Validierung-Fallback**
   * **Validates: Requirements 12.3**
   * 
   * *Für jede* ungültige oder korrupte Eingabe beim Laden von Spielstand-Daten, 
   * soll das System Standardwerte verwenden, ohne einen Fehler zu werfen.
   */
  it('Property 19: Schema-Validierung-Fallback - invalid input returns defaults without throwing', () => {
    // Test with arbitrary strings (including invalid JSON)
    fc.assert(
      fc.property(fc.string(), (invalidJson: string) => {
        // Should never throw
        const result = deserializeHighscoreData(invalidJson);
        
        // Should always return valid data
        expect(isValidHighscoreData(result)).toBe(true);
        
        // If the string happens to be valid JSON with valid schema, it should parse correctly
        // Otherwise, it should return defaults
        try {
          const parsed = JSON.parse(invalidJson);
          if (isValidHighscoreData(parsed)) {
            expect(result).toEqual(parsed);
          } else {
            expect(result.version).toBe(SCHEMA_VERSION);
            expect(result.highscore).toBe(0);
            expect(result.settings.soundEnabled).toBe(true);
          }
        } catch {
          // Invalid JSON should return defaults
          expect(result.version).toBe(SCHEMA_VERSION);
          expect(result.highscore).toBe(0);
          expect(result.settings.soundEnabled).toBe(true);
        }
      }),
      PBT_CONFIG
    );
  });

  /**
   * Additional property: Validation consistency
   * Valid data should always pass validation
   */
  it('valid HighscoreData always passes validation', () => {
    fc.assert(
      fc.property(highscoreDataArb, (data: HighscoreData) => {
        expect(isValidHighscoreData(data)).toBe(true);
      }),
      PBT_CONFIG
    );
  });

  /**
   * Additional property: Serialization produces valid JSON
   */
  it('serialization always produces parseable JSON', () => {
    fc.assert(
      fc.property(highscoreDataArb, (data: HighscoreData) => {
        const serialized = serializeHighscoreData(data);
        expect(() => JSON.parse(serialized)).not.toThrow();
      }),
      PBT_CONFIG
    );
  });
});
