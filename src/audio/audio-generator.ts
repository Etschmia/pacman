/**
 * Programmatic audio generation for game sounds.
 * Creates simple synthesized sounds using Web Audio API.
 */

/**
 * Creates a simple beep sound
 */
export function createBeepSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine'
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-3 * t / duration); // Decay envelope
    
    let sample: number;
    switch (type) {
      case 'square':
        sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        break;
      case 'sawtooth':
        sample = 2 * ((frequency * t) % 1) - 1;
        break;
      case 'triangle':
        sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * t);
    }
    
    data[i] = sample * envelope * 0.3;
  }

  return buffer;
}

/**
 * Creates a pellet collection sound (short high beep)
 */
export function createPelletSound(audioContext: AudioContext): AudioBuffer {
  return createBeepSound(audioContext, 880, 0.05, 'sine');
}

/**
 * Creates a power pellet sound (longer, lower beep with wobble)
 */
export function createPowerPelletSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.2;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-2 * t / duration);
    const frequency = 440 + 100 * Math.sin(20 * Math.PI * t); // Wobble
    const sample = Math.sin(2 * Math.PI * frequency * t);
    data[i] = sample * envelope * 0.4;
  }

  return buffer;
}

/**
 * Creates a ghost eating sound (ascending tone)
 */
export function createGhostEatSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-2 * t / duration);
    const frequency = 200 + 600 * (t / duration); // Ascending
    const sample = Math.sin(2 * Math.PI * frequency * t);
    data[i] = sample * envelope * 0.4;
  }

  return buffer;
}

/**
 * Creates a death sound (descending tone)
 */
export function createDeathSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.8;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-1.5 * t / duration);
    const frequency = 400 * Math.exp(-2 * t / duration); // Descending
    const sample = Math.sin(2 * Math.PI * frequency * t);
    data[i] = sample * envelope * 0.5;
  }

  return buffer;
}

/**
 * Creates a level complete melody (ascending arpeggio)
 */
export function createLevelCompleteSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // C major arpeggio: C, E, G, C (octave)
  const notes = [261.63, 329.63, 392.00, 523.25];
  const noteDuration = duration / notes.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.min(Math.floor(t / noteDuration), notes.length - 1);
    const noteT = t - noteIndex * noteDuration;
    const envelope = Math.exp(-3 * noteT / noteDuration);
    const frequency = notes[noteIndex];
    const sample = Math.sin(2 * Math.PI * frequency * t);
    data[i] = sample * envelope * 0.4;
  }

  return buffer;
}

/**
 * Sound generator that creates all game sounds programmatically
 */
export class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  /**
   * Initializes the sound generator and creates all sounds
   */
  initialize(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.generateAllSounds();
    } catch (error) {
      console.warn('Web Audio API not available:', error);
    }
  }

  private generateAllSounds(): void {
    if (!this.audioContext) return;

    this.sounds.set('pellet', createPelletSound(this.audioContext));
    this.sounds.set('powerPellet', createPowerPelletSound(this.audioContext));
    this.sounds.set('ghostEat', createGhostEatSound(this.audioContext));
    this.sounds.set('death', createDeathSound(this.audioContext));
    this.sounds.set('levelComplete', createLevelCompleteSound(this.audioContext));
  }

  /**
   * Gets a generated sound buffer
   */
  getSound(name: string): AudioBuffer | undefined {
    return this.sounds.get(name);
  }

  /**
   * Gets the audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Plays a sound directly (for testing)
   */
  playSound(name: string, volume: number = 0.5): void {
    if (!this.audioContext) return;
    
    const buffer = this.sounds.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start();
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sounds.clear();
  }
}

// Singleton instance
let soundGeneratorInstance: SoundGenerator | null = null;

export function getSoundGenerator(): SoundGenerator {
  if (!soundGeneratorInstance) {
    soundGeneratorInstance = new SoundGenerator();
  }
  return soundGeneratorInstance;
}

export function resetSoundGenerator(): void {
  if (soundGeneratorInstance) {
    soundGeneratorInstance.destroy();
    soundGeneratorInstance = null;
  }
}
