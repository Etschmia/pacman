import { loadHighscoreData, saveHighscoreData } from '../persistence/storage';
import { toggleSound } from '../persistence/serialization';
import type { HighscoreData } from '../types';
import { 
  createPelletSound, 
  createPowerPelletSound, 
  createGhostEatSound, 
  createDeathSound, 
  createLevelCompleteSound 
} from './audio-generator';

/**
 * Sound types available in the game
 */
export enum SoundType {
  PELLET = 'pellet',
  POWER_PELLET = 'powerPellet',
  GHOST_EAT = 'ghostEat',
  DEATH = 'death',
  LEVEL_COMPLETE = 'levelComplete',
}

/**
 * Sound configuration for each sound type
 */
interface SoundConfig {
  key: string;
  volume: number;
  poolSize: number; // Number of instances for frequent sounds
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  [SoundType.PELLET]: { key: 'pellet', volume: 0.3, poolSize: 5 },
  [SoundType.POWER_PELLET]: { key: 'powerPellet', volume: 0.5, poolSize: 2 },
  [SoundType.GHOST_EAT]: { key: 'ghostEat', volume: 0.6, poolSize: 4 },
  [SoundType.DEATH]: { key: 'death', volume: 0.7, poolSize: 1 },
  [SoundType.LEVEL_COMPLETE]: { key: 'levelComplete', volume: 0.8, poolSize: 1 },
};

/**
 * AudioManager handles all game audio including sound effects and music.
 * Implements sound pooling for frequently played sounds and mute toggle with persistence.
 * Falls back to programmatically generated sounds if audio files are not available.
 */
export class AudioManager {
  private _soundEnabled: boolean = true;
  private _highscoreData: HighscoreData;
  private _scene: Phaser.Scene | null = null;
  private _soundPools: Map<SoundType, Phaser.Sound.BaseSound[]> = new Map();
  private _poolIndices: Map<SoundType, number> = new Map();
  private _initialized: boolean = false;
  
  // Web Audio fallback
  private _audioContext: AudioContext | null = null;
  private _audioBuffers: Map<SoundType, AudioBuffer> = new Map();
  private _useWebAudioFallback: boolean = false;

  constructor() {
    this._highscoreData = loadHighscoreData();
    this._soundEnabled = this._highscoreData.settings.soundEnabled;
  }

  /** Whether sound is currently enabled */
  get soundEnabled(): boolean {
    return this._soundEnabled;
  }

  /** Whether the AudioManager has been initialized with a scene */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Initializes the AudioManager with a Phaser scene
   * Must be called after assets are loaded
   */
  initialize(scene: Phaser.Scene): void {
    this._scene = scene;
    this._initializeSoundPools();
    
    // If no Phaser sounds were loaded, use Web Audio fallback
    if (this._soundPools.size === 0) {
      this._initializeWebAudioFallback();
    }
    
    this._initialized = true;
  }

  /**
   * Creates sound pools for each sound type using Phaser
   */
  private _initializeSoundPools(): void {
    if (!this._scene) return;

    for (const [soundType, config] of Object.entries(SOUND_CONFIGS)) {
      const pool: Phaser.Sound.BaseSound[] = [];
      
      // Check if the sound asset exists
      if (!this._scene.cache.audio.exists(config.key)) {
        continue;
      }
      
      for (let i = 0; i < config.poolSize; i++) {
        try {
          const sound = this._scene.sound.add(config.key, { volume: config.volume });
          pool.push(sound);
        } catch {
          // Sound asset not loaded, skip
          console.warn(`Sound asset '${config.key}' not found`);
          break;
        }
      }
      
      if (pool.length > 0) {
        this._soundPools.set(soundType as SoundType, pool);
        this._poolIndices.set(soundType as SoundType, 0);
      }
    }
  }

  /**
   * Initializes Web Audio API fallback with programmatically generated sounds
   */
  private _initializeWebAudioFallback(): void {
    try {
      this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate sounds
      this._audioBuffers.set(SoundType.PELLET, createPelletSound(this._audioContext));
      this._audioBuffers.set(SoundType.POWER_PELLET, createPowerPelletSound(this._audioContext));
      this._audioBuffers.set(SoundType.GHOST_EAT, createGhostEatSound(this._audioContext));
      this._audioBuffers.set(SoundType.DEATH, createDeathSound(this._audioContext));
      this._audioBuffers.set(SoundType.LEVEL_COMPLETE, createLevelCompleteSound(this._audioContext));
      
      this._useWebAudioFallback = true;
      console.info('Using programmatically generated audio');
    } catch (error) {
      console.warn('Web Audio API not available:', error);
    }
  }

  /**
   * Plays a sound effect
   * Uses sound pooling for frequently played sounds
   */
  play(soundType: SoundType): void {
    if (!this._soundEnabled || !this._initialized) return;

    if (this._useWebAudioFallback) {
      this._playWebAudio(soundType);
    } else {
      this._playPhaserSound(soundType);
    }
  }

  /**
   * Plays sound using Phaser sound system
   */
  private _playPhaserSound(soundType: SoundType): void {
    const pool = this._soundPools.get(soundType);
    if (!pool || pool.length === 0) return;

    // Get next sound from pool (round-robin)
    const index = this._poolIndices.get(soundType) ?? 0;
    const sound = pool[index];
    
    // Update pool index
    this._poolIndices.set(soundType, (index + 1) % pool.length);

    // Play the sound
    if (sound && !sound.isPlaying) {
      sound.play();
    } else if (sound) {
      // If sound is already playing, try next in pool
      for (let i = 0; i < pool.length; i++) {
        const nextIndex = (index + i) % pool.length;
        if (!pool[nextIndex].isPlaying) {
          pool[nextIndex].play();
          this._poolIndices.set(soundType, (nextIndex + 1) % pool.length);
          break;
        }
      }
    }
  }

  /**
   * Plays sound using Web Audio API fallback
   */
  private _playWebAudio(soundType: SoundType): void {
    if (!this._audioContext) return;
    
    const buffer = this._audioBuffers.get(soundType);
    if (!buffer) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this._audioContext.state === 'suspended') {
      this._audioContext.resume();
    }

    const config = SOUND_CONFIGS[soundType];
    const source = this._audioContext.createBufferSource();
    const gainNode = this._audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = config.volume;
    
    source.connect(gainNode);
    gainNode.connect(this._audioContext.destination);
    
    source.start();
  }

  /**
   * Toggles sound on/off and persists the setting
   * @returns New sound enabled state
   */
  toggleMute(): boolean {
    this._soundEnabled = !this._soundEnabled;
    this._highscoreData = toggleSound(this._highscoreData);
    saveHighscoreData(this._highscoreData);
    
    // Stop all currently playing sounds if muted
    if (!this._soundEnabled) {
      this.stopAll();
    }
    
    return this._soundEnabled;
  }

  /**
   * Sets sound enabled state and persists
   */
  setSoundEnabled(enabled: boolean): void {
    if (this._soundEnabled === enabled) return;
    
    this._soundEnabled = enabled;
    
    // Update highscore data if needed
    if (this._highscoreData.settings.soundEnabled !== enabled) {
      this._highscoreData = {
        ...this._highscoreData,
        settings: {
          ...this._highscoreData.settings,
          soundEnabled: enabled,
        },
      };
      saveHighscoreData(this._highscoreData);
    }
    
    if (!this._soundEnabled) {
      this.stopAll();
    }
  }

  /**
   * Stops all currently playing sounds
   */
  stopAll(): void {
    for (const pool of this._soundPools.values()) {
      for (const sound of pool) {
        if (sound.isPlaying) {
          sound.stop();
        }
      }
    }
  }

  /**
   * Cleans up all sound resources
   */
  destroy(): void {
    this.stopAll();
    
    for (const pool of this._soundPools.values()) {
      for (const sound of pool) {
        sound.destroy();
      }
    }
    
    this._soundPools.clear();
    this._poolIndices.clear();
    this._audioBuffers.clear();
    
    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
    }
    
    this._scene = null;
    this._initialized = false;
    this._useWebAudioFallback = false;
  }

  /**
   * Reloads sound settings from storage
   * Useful after external changes to settings
   */
  reloadSettings(): void {
    this._highscoreData = loadHighscoreData();
    this._soundEnabled = this._highscoreData.settings.soundEnabled;
  }

  // Convenience methods for specific sounds

  /** Plays pellet collection sound */
  playPellet(): void {
    this.play(SoundType.PELLET);
  }

  /** Plays power pellet collection sound */
  playPowerPellet(): void {
    this.play(SoundType.POWER_PELLET);
  }

  /** Plays ghost eating sound */
  playGhostEat(): void {
    this.play(SoundType.GHOST_EAT);
  }

  /** Plays death sound */
  playDeath(): void {
    this.play(SoundType.DEATH);
  }

  /** Plays level complete melody */
  playLevelComplete(): void {
    this.play(SoundType.LEVEL_COMPLETE);
  }
}

// Singleton instance for global access
let audioManagerInstance: AudioManager | null = null;

/**
 * Gets the global AudioManager instance
 */
export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

/**
 * Resets the global AudioManager instance
 * Useful for testing
 */
export function resetAudioManager(): void {
  if (audioManagerInstance) {
    audioManagerInstance.destroy();
    audioManagerInstance = null;
  }
}
