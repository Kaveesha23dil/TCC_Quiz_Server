/**
 * Sound Manager for Quiz Application
 * Uses Web Audio API to generate sound effects
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;

    // Initialize audio context on first user interaction
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      this.enabled = false;
    }
  }

  /**
   * Resume audio context (needed for browser autoplay policies)
   */
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a tone with specified frequency and duration
   */
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    this.resumeContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play multiple tones in sequence
   */
  playSequence(notes, tempo = 200) {
    if (!this.enabled || !this.audioContext) return;

    this.resumeContext();

    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playTone(note.frequency, note.duration, note.type || 'sine');
      }, index * tempo);
    });
  }

  /**
   * Play correct answer sound - cheerful ascending notes
   */
  playCorrect() {
    this.playSequence([
      { frequency: 523.25, duration: 0.15 }, // C5
      { frequency: 659.25, duration: 0.15 }, // E5
      { frequency: 783.99, duration: 0.3 }   // G5
    ], 100);
  }

  /**
   * Play incorrect answer sound - descending notes
   */
  playIncorrect() {
    this.playSequence([
      { frequency: 392.00, duration: 0.15 }, // G4
      { frequency: 329.63, duration: 0.3 }   // E4
    ], 100);
  }

  /**
   * Play timer warning sound - urgent beeps
   */
  playTimerWarning() {
    this.playSequence([
      { frequency: 880.00, duration: 0.2, type: 'square' },
      { frequency: 880.00, duration: 0.2, type: 'square' }
    ], 250);
  }

  /**
   * Play timer tick sound - subtle click
   */
  playTimerTick() {
    this.playTone(800, 0.05, 'square');
  }

  /**
   * Play quiz completion sound - triumphant melody
   */
  playCompletion() {
    this.playSequence([
      { frequency: 523.25, duration: 0.15 }, // C5
      { frequency: 659.25, duration: 0.15 }, // E5
      { frequency: 783.99, duration: 0.15 }, // G5
      { frequency: 1046.50, duration: 0.4 }  // C6
    ], 120);
  }

  /**
   * Play quiz start sound - welcoming notes
   */
  playStart() {
    this.playSequence([
      { frequency: 392.00, duration: 0.15 }, // G4
      { frequency: 523.25, duration: 0.15 }, // C5
      { frequency: 659.25, duration: 0.3 }   // E5
    ], 120);
  }

  /**
   * Play button click sound - subtle feedback
   */
  playClick() {
    this.playTone(600, 0.05, 'sine');
  }

  /**
   * Play alert sound - attention getter
   */
  playAlert() {
    this.playSequence([
      { frequency: 880.00, duration: 0.2, type: 'triangle' },
      { frequency: 0, duration: 0.1 },
      { frequency: 880.00, duration: 0.2, type: 'triangle' }
    ], 150);
  }

  /**
   * Play achievement sound - success fanfare
   */
  playAchievement(score) {
    if (score >= 90) {
      // Outstanding performance
      this.playSequence([
        { frequency: 523.25, duration: 0.1 }, // C5
        { frequency: 659.25, duration: 0.1 }, // E5
        { frequency: 783.99, duration: 0.1 }, // G5
        { frequency: 1046.50, duration: 0.1 }, // C6
        { frequency: 1318.51, duration: 0.4 }  // E6
      ], 100);
    } else if (score >= 70) {
      // Good performance
      this.playSequence([
        { frequency: 523.25, duration: 0.15 }, // C5
        { frequency: 659.25, duration: 0.15 }, // E5
        { frequency: 783.99, duration: 0.3 }   // G5
      ], 120);
    } else if (score >= 50) {
      // Passing performance
      this.playSequence([
        { frequency: 523.25, duration: 0.2 },
        { frequency: 659.25, duration: 0.3 }
      ], 150);
    } else {
      // Needs improvement
      this.playTone(392.00, 0.4, 'sine');
    }
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Test all sounds
   */
  testSounds() {
    const sounds = [
      { name: 'Correct', fn: () => this.playCorrect() },
      { name: 'Incorrect', fn: () => this.playIncorrect() },
      { name: 'Timer Warning', fn: () => this.playTimerWarning() },
      { name: 'Completion', fn: () => this.playCompletion() },
      { name: 'Start', fn: () => this.playStart() },
      { name: 'Click', fn: () => this.playClick() },
      { name: 'Alert', fn: () => this.playAlert() }
    ];

    sounds.forEach((sound, index) => {
      setTimeout(() => {
        console.log(`Playing: ${sound.name}`);
        sound.fn();
      }, index * 1500);
    });
  }
}

// Create global instance
const soundManager = new SoundManager();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager;
}
