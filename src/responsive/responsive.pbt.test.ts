/**
 * Property-Based Tests for Responsive Scaling
 * 
 * **Feature: pacman-clone, Property 22: Responsive-Skalierung-Seitenverhältnis**
 * **Validates: Requirements 11.1**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateScale, detectInputMethod, detectTouchSupport, detectKeyboardSupport } from './ResponsiveManager';
import { PBT_CONFIG } from '../test/pbt-config';

describe('Responsive Scaling Property Tests', () => {
  /**
   * Property 22: Responsive-Skalierung-Seitenverhältnis
   * *Für jede* Fenstergrößenänderung, soll das Seitenverhältnis des Spielfelds konstant bleiben.
   */
  describe('Property 22: Aspect Ratio Preservation', () => {
    const BASE_WIDTH = 448;
    const BASE_HEIGHT = 496;
    const BASE_ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;

    it('should maintain aspect ratio for any viewport size', () => {
      fc.assert(
        fc.property(
          // Generate random viewport dimensions
          fc.integer({ min: 100, max: 4000 }), // viewport width
          fc.integer({ min: 100, max: 4000 }), // viewport height
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight
            );

            // The scaled dimensions should maintain the original aspect ratio
            const scaledAspectRatio = result.width / result.height;
            
            // Allow small floating point tolerance
            const tolerance = 0.01;
            expect(Math.abs(scaledAspectRatio - BASE_ASPECT_RATIO)).toBeLessThan(tolerance);
            
            // The aspect ratio returned should match base aspect ratio
            expect(result.aspectRatio).toBeCloseTo(BASE_ASPECT_RATIO, 5);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    it('should scale proportionally for any viewport', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 4000 }),
          fc.integer({ min: 100, max: 4000 }),
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight
            );

            // Scaled width should equal base width * scale
            expect(result.width).toBe(Math.floor(BASE_WIDTH * result.scale));
            
            // Scaled height should equal base height * scale
            expect(result.height).toBe(Math.floor(BASE_HEIGHT * result.scale));
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    it('should fit within viewport bounds when scale allows', () => {
      fc.assert(
        fc.property(
          // Use viewport sizes that are large enough to not hit minScale
          fc.integer({ min: 300, max: 4000 }),
          fc.integer({ min: 300, max: 4000 }),
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight,
              0.1, // Very low minScale to avoid clamping
              10.0 // Very high maxScale
            );

            // Scaled dimensions should not exceed viewport
            expect(result.width).toBeLessThanOrEqual(viewportWidth);
            expect(result.height).toBeLessThanOrEqual(viewportHeight);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    it('should respect min/max scale bounds', () => {
      const minScale = 0.5;
      const maxScale = 2.0;

      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 5000 }),
          fc.integer({ min: 10, max: 5000 }),
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight,
              minScale,
              maxScale
            );

            // Scale should be within bounds
            expect(result.scale).toBeGreaterThanOrEqual(minScale);
            expect(result.scale).toBeLessThanOrEqual(maxScale);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    it('should maximize game size within viewport while maintaining aspect ratio', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 2000 }),
          fc.integer({ min: 200, max: 2000 }),
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight,
              0.1, // Very low min to not interfere
              10.0 // Very high max to not interfere
            );

            // Either width or height should be at maximum (touching viewport edge)
            const widthRatio = result.width / viewportWidth;
            const heightRatio = result.height / viewportHeight;
            
            // At least one dimension should be close to 1.0 (filling that dimension)
            const maxRatio = Math.max(widthRatio, heightRatio);
            expect(maxRatio).toBeGreaterThan(0.99);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    it('should handle extreme aspect ratios correctly', () => {
      fc.assert(
        fc.property(
          // Very wide viewport
          fc.integer({ min: 1000, max: 4000 }),
          fc.integer({ min: 100, max: 300 }),
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight
            );

            // Should still maintain aspect ratio
            const scaledAspectRatio = result.width / result.height;
            expect(Math.abs(scaledAspectRatio - BASE_ASPECT_RATIO)).toBeLessThan(0.01);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    it('should handle very tall viewports correctly', () => {
      fc.assert(
        fc.property(
          // Very tall viewport
          fc.integer({ min: 100, max: 300 }),
          fc.integer({ min: 1000, max: 4000 }),
          (viewportWidth, viewportHeight) => {
            const result = calculateScale(
              BASE_WIDTH,
              BASE_HEIGHT,
              viewportWidth,
              viewportHeight
            );

            // Should still maintain aspect ratio
            const scaledAspectRatio = result.width / result.height;
            expect(Math.abs(scaledAspectRatio - BASE_ASPECT_RATIO)).toBeLessThan(0.01);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Input Method Detection', () => {
    it('should return valid input method', () => {
      const method = detectInputMethod();
      expect(['keyboard', 'touch', 'both']).toContain(method);
    });

    it('should return boolean for touch support', () => {
      const hasTouch = detectTouchSupport();
      expect(typeof hasTouch).toBe('boolean');
    });

    it('should return boolean for keyboard support', () => {
      const hasKeyboard = detectKeyboardSupport();
      expect(typeof hasKeyboard).toBe('boolean');
    });
  });
});
