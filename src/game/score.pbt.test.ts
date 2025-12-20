import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ScoreManager, PELLET_POINTS, POWER_PELLET_POINTS, GHOST_CHAIN_MULTIPLIERS } from './ScoreManager';
import { PBT_CONFIG } from '../test/pbt-config';

/**
 * **Feature: pacman-clone, Property 5: Score-Berechnung-Korrektheit**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * *Für jede* Sequenz von gesammelten Pellets (n normale Pellets, m Power-Pellets),
 * soll der resultierende Score exakt (n × 10 + m × 50) plus eventuelle Ghost-Eating-Boni betragen.
 */
describe('Property 5: Score-Berechnung-Korrektheit', () => {
  it('should calculate pellet score correctly for any number of pellets', () => {
    fc.assert(
      fc.property(
        // Max 244 normal pellets (typical maze), max 4 power pellets
        fc.nat({ max: 244 }),
        fc.nat({ max: 4 }),
        (normalPellets, powerPellets) => {
          const expectedScore = normalPellets * PELLET_POINTS + powerPellets * POWER_PELLET_POINTS;
          const calculatedScore = ScoreManager.calculateScore(normalPellets, powerPellets);
          
          expect(calculatedScore).toBe(expectedScore);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should accumulate score correctly when collecting pellets sequentially', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }),
        fc.nat({ max: 4 }),
        (normalPellets, powerPellets) => {
          const scoreManager = new ScoreManager();
          
          // Collect normal pellets
          for (let i = 0; i < normalPellets; i++) {
            scoreManager.collectPellet();
          }
          
          // Collect power pellets
          for (let i = 0; i < powerPellets; i++) {
            scoreManager.collectPowerPellet();
          }
          
          const expectedScore = normalPellets * PELLET_POINTS + powerPellets * POWER_PELLET_POINTS;
          expect(scoreManager.score).toBe(expectedScore);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should calculate ghost chain bonus correctly for any chain length', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10 }),
        (chainIndex) => {
          const expectedBonus = GHOST_CHAIN_MULTIPLIERS[Math.min(chainIndex, GHOST_CHAIN_MULTIPLIERS.length - 1)];
          const actualBonus = ScoreManager.getGhostChainBonus(chainIndex);
          
          expect(actualBonus).toBe(expectedBonus);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should accumulate ghost eating bonus correctly in chain', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 4 }),
        (ghostsEaten) => {
          const scoreManager = new ScoreManager();
          let expectedScore = 0;
          
          for (let i = 0; i < ghostsEaten; i++) {
            const bonus = GHOST_CHAIN_MULTIPLIERS[Math.min(i, GHOST_CHAIN_MULTIPLIERS.length - 1)];
            expectedScore += bonus;
            scoreManager.eatGhost();
          }
          
          expect(scoreManager.score).toBe(expectedScore);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should calculate total score correctly with pellets and ghosts', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 50 }),
        fc.nat({ max: 4 }),
        fc.nat({ max: 4 }),
        (normalPellets, powerPellets, ghostsEaten) => {
          const scoreManager = new ScoreManager();
          
          // Collect pellets first
          for (let i = 0; i < normalPellets; i++) {
            scoreManager.collectPellet();
          }
          
          // Collect power pellet (resets ghost chain)
          for (let i = 0; i < powerPellets; i++) {
            scoreManager.collectPowerPellet();
          }
          
          // Eat ghosts
          let ghostBonus = 0;
          for (let i = 0; i < ghostsEaten; i++) {
            ghostBonus += GHOST_CHAIN_MULTIPLIERS[Math.min(i, GHOST_CHAIN_MULTIPLIERS.length - 1)];
            scoreManager.eatGhost();
          }
          
          const expectedScore = normalPellets * PELLET_POINTS + 
                               powerPellets * POWER_PELLET_POINTS + 
                               ghostBonus;
          
          expect(scoreManager.score).toBe(expectedScore);
        }
      ),
      PBT_CONFIG
    );
  });
});
