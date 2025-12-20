import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager, PELLET_POINTS, POWER_PELLET_POINTS, GHOST_CHAIN_MULTIPLIERS } from './ScoreManager';

// Mock the persistence module
vi.mock('../persistence/storage', () => ({
  loadHighscoreData: vi.fn(() => ({
    version: 1,
    highscore: 1000,
    lastPlayed: new Date().toISOString(),
    settings: { soundEnabled: true },
  })),
  saveHighscoreData: vi.fn(),
}));

vi.mock('../persistence/serialization', () => ({
  updateHighscore: vi.fn((current, newScore) => ({
    ...current,
    highscore: Math.max(current.highscore, newScore),
    lastPlayed: new Date().toISOString(),
  })),
}));

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    vi.clearAllMocks();
    scoreManager = new ScoreManager();
  });

  describe('initialization', () => {
    it('should start with score 0', () => {
      expect(scoreManager.score).toBe(0);
    });

    it('should load highscore from storage', () => {
      expect(scoreManager.highscore).toBe(1000);
    });

    it('should start with ghost chain index 0', () => {
      expect(scoreManager.ghostChainIndex).toBe(0);
    });
  });

  describe('collectPellet', () => {
    it('should add 10 points for a pellet', () => {
      const points = scoreManager.collectPellet();
      expect(points).toBe(PELLET_POINTS);
      expect(scoreManager.score).toBe(10);
    });

    it('should accumulate points for multiple pellets', () => {
      scoreManager.collectPellet();
      scoreManager.collectPellet();
      scoreManager.collectPellet();
      expect(scoreManager.score).toBe(30);
    });
  });

  describe('collectPowerPellet', () => {
    it('should add 50 points for a power pellet', () => {
      const points = scoreManager.collectPowerPellet();
      expect(points).toBe(POWER_PELLET_POINTS);
      expect(scoreManager.score).toBe(50);
    });

    it('should reset ghost chain when collecting power pellet', () => {
      scoreManager.eatGhost(); // chain index becomes 1
      expect(scoreManager.ghostChainIndex).toBe(1);
      scoreManager.collectPowerPellet();
      expect(scoreManager.ghostChainIndex).toBe(0);
    });
  });

  describe('eatGhost', () => {
    it('should give 200 points for first ghost', () => {
      const points = scoreManager.eatGhost();
      expect(points).toBe(200);
      expect(scoreManager.score).toBe(200);
    });

    it('should give 400 points for second ghost', () => {
      scoreManager.eatGhost();
      const points = scoreManager.eatGhost();
      expect(points).toBe(400);
      expect(scoreManager.score).toBe(600);
    });

    it('should give 800 points for third ghost', () => {
      scoreManager.eatGhost();
      scoreManager.eatGhost();
      const points = scoreManager.eatGhost();
      expect(points).toBe(800);
      expect(scoreManager.score).toBe(1400);
    });

    it('should give 1600 points for fourth ghost', () => {
      scoreManager.eatGhost();
      scoreManager.eatGhost();
      scoreManager.eatGhost();
      const points = scoreManager.eatGhost();
      expect(points).toBe(1600);
      expect(scoreManager.score).toBe(3000);
    });

    it('should cap at 1600 points for fifth+ ghost', () => {
      for (let i = 0; i < 4; i++) {
        scoreManager.eatGhost();
      }
      const points = scoreManager.eatGhost();
      expect(points).toBe(1600);
    });

    it('should increment ghost chain index', () => {
      expect(scoreManager.ghostChainIndex).toBe(0);
      scoreManager.eatGhost();
      expect(scoreManager.ghostChainIndex).toBe(1);
      scoreManager.eatGhost();
      expect(scoreManager.ghostChainIndex).toBe(2);
    });
  });

  describe('resetGhostChain', () => {
    it('should reset ghost chain index to 0', () => {
      scoreManager.eatGhost();
      scoreManager.eatGhost();
      expect(scoreManager.ghostChainIndex).toBe(2);
      scoreManager.resetGhostChain();
      expect(scoreManager.ghostChainIndex).toBe(0);
    });
  });

  describe('resetScore', () => {
    it('should reset score to 0', () => {
      scoreManager.collectPellet();
      scoreManager.collectPellet();
      expect(scoreManager.score).toBe(20);
      scoreManager.resetScore();
      expect(scoreManager.score).toBe(0);
    });

    it('should reset ghost chain index', () => {
      scoreManager.eatGhost();
      scoreManager.resetScore();
      expect(scoreManager.ghostChainIndex).toBe(0);
    });

    it('should not reset highscore', () => {
      // Score exceeds highscore
      for (let i = 0; i < 200; i++) {
        scoreManager.collectPellet();
      }
      expect(scoreManager.highscore).toBe(2000);
      scoreManager.resetScore();
      expect(scoreManager.highscore).toBe(2000);
    });
  });

  describe('highscore tracking', () => {
    it('should update highscore when score exceeds it', () => {
      // Initial highscore is 1000
      expect(scoreManager.highscore).toBe(1000);
      
      // Add enough points to exceed highscore
      for (let i = 0; i < 101; i++) {
        scoreManager.collectPellet();
      }
      expect(scoreManager.score).toBe(1010);
      expect(scoreManager.highscore).toBe(1010);
    });

    it('should not update highscore when score is lower', () => {
      scoreManager.collectPellet();
      expect(scoreManager.highscore).toBe(1000);
    });
  });

  describe('static calculateScore', () => {
    it('should calculate score correctly', () => {
      expect(ScoreManager.calculateScore(10, 0)).toBe(100);
      expect(ScoreManager.calculateScore(0, 4)).toBe(200);
      expect(ScoreManager.calculateScore(10, 4)).toBe(300);
      expect(ScoreManager.calculateScore(244, 4)).toBe(2640);
    });

    it('should handle zero inputs', () => {
      expect(ScoreManager.calculateScore(0, 0)).toBe(0);
    });
  });

  describe('static getGhostChainBonus', () => {
    it('should return correct bonus for each chain position', () => {
      expect(ScoreManager.getGhostChainBonus(0)).toBe(200);
      expect(ScoreManager.getGhostChainBonus(1)).toBe(400);
      expect(ScoreManager.getGhostChainBonus(2)).toBe(800);
      expect(ScoreManager.getGhostChainBonus(3)).toBe(1600);
    });

    it('should cap at 1600 for index >= 4', () => {
      expect(ScoreManager.getGhostChainBonus(4)).toBe(1600);
      expect(ScoreManager.getGhostChainBonus(10)).toBe(1600);
    });
  });
});
