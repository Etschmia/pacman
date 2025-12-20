import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager, SoundType, getAudioManager, resetAudioManager } from './AudioManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock Phaser sound
const createMockSound = () => ({
  play: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
  isPlaying: false,
});

const createMockScene = () => ({
  sound: {
    add: vi.fn(() => createMockSound()),
  },
  cache: {
    audio: {
      exists: vi.fn(() => false), // No audio assets in tests
    },
  },
});

describe('AudioManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetAudioManager();
  });

  afterEach(() => {
    resetAudioManager();
  });

  describe('constructor', () => {
    it('should initialize with sound enabled by default', () => {
      const manager = new AudioManager();
      expect(manager.soundEnabled).toBe(true);
    });

    it('should load sound setting from storage', () => {
      const savedData = {
        version: 1,
        highscore: 1000,
        lastPlayed: new Date().toISOString(),
        settings: { soundEnabled: false },
      };
      localStorageMock.setItem('pacman-highscore', JSON.stringify(savedData));
      
      const manager = new AudioManager();
      expect(manager.soundEnabled).toBe(false);
    });
  });

  describe('toggleMute', () => {
    it('should toggle sound enabled state', () => {
      const manager = new AudioManager();
      expect(manager.soundEnabled).toBe(true);
      
      const result = manager.toggleMute();
      expect(result).toBe(false);
      expect(manager.soundEnabled).toBe(false);
      
      const result2 = manager.toggleMute();
      expect(result2).toBe(true);
      expect(manager.soundEnabled).toBe(true);
    });

    it('should persist sound setting to storage', () => {
      const manager = new AudioManager();
      manager.toggleMute();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls.at(-1)?.[1] ?? '{}');
      expect(savedData.settings.soundEnabled).toBe(false);
    });
  });

  describe('setSoundEnabled', () => {
    it('should set sound enabled state', () => {
      const manager = new AudioManager();
      
      manager.setSoundEnabled(false);
      expect(manager.soundEnabled).toBe(false);
      
      manager.setSoundEnabled(true);
      expect(manager.soundEnabled).toBe(true);
    });

    it('should not update storage if value unchanged', () => {
      const manager = new AudioManager();
      const callCount = localStorageMock.setItem.mock.calls.length;
      
      manager.setSoundEnabled(true); // Already true
      expect(localStorageMock.setItem.mock.calls.length).toBe(callCount);
    });
  });

  describe('initialize', () => {
    it('should set initialized to true after initialization', () => {
      const manager = new AudioManager();
      const mockScene = createMockScene();
      
      expect(manager.initialized).toBe(false);
      manager.initialize(mockScene as unknown as Phaser.Scene);
      expect(manager.initialized).toBe(true);
    });

    it('should use Web Audio fallback when no Phaser sounds available', () => {
      const manager = new AudioManager();
      const mockScene = createMockScene();
      
      manager.initialize(mockScene as unknown as Phaser.Scene);
      
      // Since no audio assets exist, it should fall back to Web Audio
      // The manager should still be initialized
      expect(manager.initialized).toBe(true);
    });
  });

  describe('play', () => {
    it('should not play when sound is disabled', () => {
      const manager = new AudioManager();
      const mockScene = createMockScene();
      manager.initialize(mockScene as unknown as Phaser.Scene);
      
      manager.setSoundEnabled(false);
      
      // Should not throw when playing with sound disabled
      expect(() => manager.play(SoundType.PELLET)).not.toThrow();
    });

    it('should not play when not initialized', () => {
      const manager = new AudioManager();
      // Don't initialize
      
      // Should not throw
      expect(() => manager.play(SoundType.PELLET)).not.toThrow();
    });
  });

  describe('convenience methods', () => {
    it('should have convenience methods for each sound type', () => {
      const manager = new AudioManager();
      
      expect(typeof manager.playPellet).toBe('function');
      expect(typeof manager.playPowerPellet).toBe('function');
      expect(typeof manager.playGhostEat).toBe('function');
      expect(typeof manager.playDeath).toBe('function');
      expect(typeof manager.playLevelComplete).toBe('function');
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const manager = new AudioManager();
      const mockScene = createMockScene();
      manager.initialize(mockScene as unknown as Phaser.Scene);
      
      manager.destroy();
      
      expect(manager.initialized).toBe(false);
    });
  });

  describe('singleton', () => {
    it('should return same instance from getAudioManager', () => {
      const instance1 = getAudioManager();
      const instance2 = getAudioManager();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getAudioManager();
      resetAudioManager();
      const instance2 = getAudioManager();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('reloadSettings', () => {
    it('should reload settings from storage', () => {
      const manager = new AudioManager();
      expect(manager.soundEnabled).toBe(true);
      
      // Simulate external change to storage
      const savedData = {
        version: 1,
        highscore: 0,
        lastPlayed: new Date().toISOString(),
        settings: { soundEnabled: false },
      };
      localStorageMock.setItem('pacman-highscore', JSON.stringify(savedData));
      
      manager.reloadSettings();
      expect(manager.soundEnabled).toBe(false);
    });
  });
});
