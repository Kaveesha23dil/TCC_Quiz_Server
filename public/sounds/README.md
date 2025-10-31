# Quiz Sound Effects System

This directory contains the sound management system for the quiz application. The system provides audio feedback for various quiz interactions to enhance user experience.

## Overview

The sound system uses the **Web Audio API** to generate sounds dynamically, which means:
- No external audio files required
- Works offline
- Lightweight and fast
- Cross-browser compatible

## Features

### Sound Effects Included

1. **Correct Answer** - Cheerful ascending melody
2. **Incorrect Answer** - Descending tone
3. **Timer Warning** - Alert beeps when 60 seconds remain
4. **Timer Tick** - Urgent ticks in final 10 seconds
5. **Quiz Completion** - Triumphant fanfare
6. **Quiz Start** - Welcome melody
7. **Click Feedback** - Subtle click for interactions
8. **Alert Sound** - Attention-getting notification
9. **Achievement Sound** - Score-based celebration (varies by performance)

### Sound Triggers

#### Individual Quiz (index.html)
- **Join Quiz** → Start sound
- **Answer Selection** → Click sound
- **Timer: 60 seconds** → Warning sound
- **Timer: ≤10 seconds** → Tick sound (every second)
- **Time Expired** → Alert sound
- **Submit Quiz** → Alert sound
- **Score Display** → Achievement sound (based on score)

#### Team Quiz (team_quiz.html)
- **Create Team** → Start sound
- **Join Team** → Start sound
- **Quiz Starts** → Start sound
- **Answer Updated** → Click sound
- **Submit Answers** → Alert sound
- **Results Display** → Achievement sound (based on score)

## Usage

### Basic Integration

The sound manager is automatically loaded in both quiz pages:

```html
<script src="sounds/sound-manager.js"></script>
```

### API Reference

#### Playing Sounds

```javascript
// Play predefined sound effects
soundManager.playCorrect();        // Correct answer
soundManager.playIncorrect();      // Incorrect answer
soundManager.playTimerWarning();   // Timer warning
soundManager.playTimerTick();      // Timer tick
soundManager.playCompletion();     // Quiz completion
soundManager.playStart();          // Quiz/team start
soundManager.playClick();          // Button/answer click
soundManager.playAlert();          // Alert notification
soundManager.playAchievement(90);  // Achievement (pass score %)
```

#### Custom Sounds

```javascript
// Play custom tone
soundManager.playTone(frequency, duration, type);
// frequency: Hz (e.g., 440 for A4)
// duration: seconds (e.g., 0.5)
// type: 'sine', 'square', 'triangle', 'sawtooth'

// Play sequence of notes
soundManager.playSequence([
  { frequency: 523.25, duration: 0.2 }, // C5
  { frequency: 659.25, duration: 0.2 }  // E5
], 150); // tempo in ms between notes
```

#### Configuration

```javascript
// Enable/disable all sounds
soundManager.setEnabled(true);  // or false

// Adjust volume (0.0 to 1.0)
soundManager.setVolume(0.5);

// Test all sounds (for debugging)
soundManager.testSounds();
```

## Achievement Sound Scoring

The achievement sound varies based on quiz performance:

| Score Range | Sound Type | Description |
|-------------|------------|-------------|
| 90-100% | Outstanding | 5-note ascending melody |
| 70-89% | Great | 3-note ascending melody |
| 50-69% | Good | 2-note melody |
| 0-49% | Try Again | Single warm tone |

## Browser Compatibility

The sound system works in all modern browsers that support the Web Audio API:
- Chrome/Edge 35+
- Firefox 25+
- Safari 14.1+
- Opera 22+

### Browser Autoplay Policies

Modern browsers require user interaction before playing audio. The sound manager handles this automatically by:
1. Initializing the audio context on first user interaction
2. Resuming the context when suspended
3. Gracefully degrading if Web Audio API is unavailable

## Customization

### Modifying Sounds

Edit `sound-manager.js` to customize the sounds. For example, to change the correct answer sound:

```javascript
playCorrect() {
  this.playSequence([
    { frequency: 440, duration: 0.2 },  // Your custom notes
    { frequency: 550, duration: 0.2 },
    { frequency: 660, duration: 0.3 }
  ], 100);
}
```

### Using Custom Audio Files

If you prefer to use audio files instead of generated tones, you can extend the SoundManager class:

```javascript
playCustomSound(audioFilePath) {
  const audio = new Audio(audioFilePath);
  audio.volume = this.volume;
  audio.play().catch(e => console.warn('Audio playback failed:', e));
}
```

## Troubleshooting

### No Sound Playing

1. **Check browser compatibility** - Ensure Web Audio API is supported
2. **Check volume** - Verify system and manager volume settings
3. **Check enabled status** - Ensure sounds are enabled via `soundManager.setEnabled(true)`
4. **Browser autoplay** - Sounds only work after user interaction

### Sounds Too Loud/Quiet

Adjust the volume:
```javascript
soundManager.setVolume(0.3); // Range: 0.0 - 1.0
```

### Testing Sounds

Use the test function to verify all sounds:
```javascript
soundManager.testSounds();
```

This plays each sound effect in sequence with a 1.5-second delay between sounds.

## Future Enhancements

Potential improvements:
- [ ] Add more sound variations
- [ ] Implement sound themes (professional, playful, etc.)
- [ ] Add haptic feedback for mobile devices
- [ ] Spatial audio for team collaboration
- [ ] User-customizable sounds
- [ ] Sound presets (muted, subtle, normal, loud)

## Technical Details

### Audio Generation

The system uses oscillators to generate tones:
- **Sine waves**: Smooth, pure tones (default)
- **Square waves**: Electronic, retro sounds
- **Triangle waves**: Softer than square, warmer than sine
- **Sawtooth waves**: Rich, bright tones

### Performance

- Minimal CPU usage (Web Audio API is hardware-accelerated)
- No network requests (all sounds generated in-browser)
- No storage required (no audio files to cache)

## License

Part of the QuizServer application.

## Support

For issues or questions about the sound system, refer to the main project documentation or submit an issue to the project repository.
