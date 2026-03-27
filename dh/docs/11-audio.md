# Audio System

This document covers sound effects, background music, and audio management.

## Audio Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIO SYSTEM                                  │
└─────────────────────────────────────────────────────────────────┘

                @telazer/phaser-audio-helper
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  SFX Manager  │ │ Music Manager │ │ Volume Control│
│               │ │               │ │               │
│ • One-shots   │ │ • Background  │ │ • Master vol  │
│ • Channels    │ │ • Looping     │ │ • SFX volume  │
│ • Pooling     │ │ • Crossfade   │ │ • Music vol   │
└───────────────┘ └───────────────┘ └───────────────┘
```

## @telazer/phaser-audio-helper

### Initialization

```javascript
import { AudioHelper } from '@telazer/phaser-audio-helper';

// Initialize in scene
create() {
  AudioHelper.init(this);

  // Set initial volumes from settings
  const settings = settingsStore.get('audio');
  AudioHelper.setSFXVolume(settings.sfxVolume);
  AudioHelper.setMusicVolume(settings.musicVolume);
}
```

### Sound Effects

```javascript
// Play one-shot sound
AudioHelper.playSFX('hit');

// Play with volume override
AudioHelper.playSFX('hit', { volume: 0.5 });

// Play with pitch variation
AudioHelper.playSFX('hit', {
  rate: 0.9 + Math.random() * 0.2 // 0.9 - 1.1x speed
});

// Channel-based playback (stops previous on same channel)
AudioHelper.playSFX('footstep', { channel: 'footsteps' });
```

### Background Music

```javascript
// Play music (loops by default)
AudioHelper.playMusic('forest_theme');

// Play with fade in
AudioHelper.playMusic('forest_theme', {
  fadeIn: 2000 // 2 second fade
});

// Crossfade to new track
AudioHelper.crossfadeMusic('battle_theme', 1500);

// Stop music
AudioHelper.stopMusic();

// Stop with fade out
AudioHelper.stopMusic({ fadeOut: 1000 });
```

## Sound Effects Catalog

### Combat Sounds

| Sound | File | Trigger |
|-------|------|---------|
| `hit` | `hit.mp3` | Melee attack connects |
| `arrow` | `arrow.mp3` | Projectile launch |
| `arrow_hit` | `arrow_hit.mp3` | Projectile impact |
| `boom` | `boom.mp3` | Explosion/AOE |
| `slash` | `slash.mp3` | Sword swing |
| `cough` | `cough.mp3` | Poison effect |
| `heal` | `heal.mp3` | Health restore |

### UI Sounds

| Sound | File | Trigger |
|-------|------|---------|
| `click` | `click.mp3` | Button press |
| `hover` | `hover.mp3` | Button hover |
| `open` | `open.mp3` | Menu open |
| `close` | `close.mp3` | Menu close |
| `equip` | `equip.mp3` | Item equipped |
| `coin` | `coin.mp3` | Gold pickup |
| `levelup` | `levelup.mp3` | Level up |

### Environment Sounds

| Sound | File | Trigger |
|-------|------|---------|
| `footstep` | `footstep.mp3` | Walking |
| `door` | `door.mp3` | Door interaction |
| `chest` | `chest.mp3` | Chest open |
| `ambient_forest` | `ambient_forest.mp3` | Forest ambience |

## Music Tracks

### Available Music

| Track | File | Duration | Usage |
|-------|------|----------|-------|
| `main_theme` | `main_theme.mp3` | 2:30 | Title screen |
| `forest_theme` | `forest_theme.mp3` | 3:15 | Forest map |
| `desert_theme` | `desert_theme.mp3` | 2:45 | Desert map |
| `dungeon_theme` | `dungeon_theme.mp3` | 3:00 | Dungeon map |
| `battle_theme` | `battle_theme.mp3` | 2:00 | Boss fights |
| `victory` | `victory.mp3` | 0:30 | Victory jingle |
| `shop_theme` | `shop_theme.mp3` | 2:15 | Shop/menu |

### Music by Map

| Map | Music Track |
|-----|-------------|
| Forest | `forest_theme` |
| Desert | `desert_theme` |
| Jungle | `jungle_theme` |
| Water | `water_theme` |
| Village | `village_theme` |
| Graveyard | `graveyard_theme` |
| Dungeon | `dungeon_theme` |
| Castle | `castle_theme` |
| Cave | `cave_theme` |
| Inferno | `inferno_theme` |
| Snow | `snow_theme` |

## Volume Control

### Volume Settings

```javascript
// Get current volumes
const sfxVolume = AudioHelper.getSFXVolume();    // 0.0 - 1.0
const musicVolume = AudioHelper.getMusicVolume(); // 0.0 - 1.0

// Set volumes
AudioHelper.setSFXVolume(0.8);  // 80%
AudioHelper.setMusicVolume(0.5); // 50%

// Mute/unmute
AudioHelper.muteSFX(true);
AudioHelper.muteMusic(true);

// Toggle mute
AudioHelper.toggleMute();
```

### Settings Integration

```javascript
// Load from settings store
const loadAudioSettings = () => {
  const settings = settingsStore.get('audio');

  AudioHelper.setSFXVolume(settings.sfxVolume);
  AudioHelper.setMusicVolume(settings.musicVolume);

  if (settings.muted) {
    AudioHelper.mute(true);
  }
};

// Save to settings store
const saveAudioSettings = () => {
  settingsStore.set('audio', {
    sfxVolume: AudioHelper.getSFXVolume(),
    musicVolume: AudioHelper.getMusicVolume(),
    muted: AudioHelper.isMuted()
  });
};
```

## Audio Events

### Event-Driven Audio

```javascript
// Combat events
events.on('enemyHit', (enemy, damage) => {
  AudioHelper.playSFX('hit', {
    volume: Math.min(damage / 1000, 1) // Louder for bigger hits
  });
});

events.on('playerDeath', () => {
  AudioHelper.playSFX('death');
  AudioHelper.fadeOutMusic(2000);
});

events.on('bossSpawn', () => {
  AudioHelper.crossfadeMusic('boss_theme', 1000);
});

// UI events
events.on('buttonClick', () => {
  AudioHelper.playSFX('click');
});

events.on('levelUp', () => {
  AudioHelper.playSFX('levelup');
});
```

### Map Change Music

```javascript
// Change music when entering new map
events.on('mapChange', (newMap) => {
  const trackMap = {
    'map:forest': 'forest_theme',
    'map:desert': 'desert_theme',
    'map:dungeon': 'dungeon_theme',
    // ... other maps
  };

  const track = trackMap[newMap] || 'main_theme';
  AudioHelper.crossfadeMusic(track, 2000);
});
```

## Audio Pooling

### Sound Pool System

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIO POOLING                                 │
│                                                                  │
│  Problem: Creating new Audio objects is expensive               │
│                                                                  │
│  Solution: Pre-create and reuse audio instances                 │
│                                                                  │
│  Pool Structure:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 'hit' sound pool:                                       │   │
│  │ [Audio1: idle] [Audio2: playing] [Audio3: idle] ...    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  When playSFX('hit'):                                           │
│  1. Find idle instance in pool                                  │
│  2. Reset and play                                              │
│  3. Mark as playing                                             │
│  4. On complete, mark as idle                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pool Configuration

```javascript
// Pre-load frequently used sounds
AudioHelper.preloadPool('hit', 5);     // 5 instances
AudioHelper.preloadPool('footstep', 3);
AudioHelper.preloadPool('coin', 10);

// Pool auto-expands if needed
// But pre-loading prevents audio delay
```

## Fade Effects

### Fade Patterns

```javascript
// Fade in new music
AudioHelper.playMusic('theme', {
  fadeIn: 2000,
  volume: 0.8
});

// Fade out current music
AudioHelper.fadeOutMusic(1500);

// Crossfade (fade out old, fade in new)
AudioHelper.crossfadeMusic('new_theme', 2000);

// Duck music during speech/event
AudioHelper.duckMusic(0.3, 500); // 30% volume, 500ms fade
// ... play speech
AudioHelper.unduckMusic(500);     // Restore volume
```

## Pause/Resume

### Audio Pause Handling

```javascript
// Pause all audio
AudioHelper.pause();

// Resume all audio
AudioHelper.resume();

// Pause only music (keep SFX)
AudioHelper.pauseMusic();
AudioHelper.resumeMusic();

// Integration with game pause
events.on('gamePause', () => {
  AudioHelper.pause();
});

events.on('gameResume', () => {
  AudioHelper.resume();
});
```

## Spatial Audio

### Position-Based Volume

```javascript
// Adjust volume based on distance from camera
const playSpatialSFX = (sound, x, y) => {
  const camera = scene.cameras.main;
  const distance = Phaser.Math.Distance.Between(
    camera.scrollX + camera.width / 2,
    camera.scrollY + camera.height / 2,
    x, y
  );

  const maxDistance = 500;
  const volume = Math.max(0, 1 - distance / maxDistance);

  if (volume > 0.1) {
    AudioHelper.playSFX(sound, { volume });
  }
};
```

## Audio Loading

### Preloading

```javascript
preload() {
  // Load sound effects
  this.load.audio('hit', 'sounds/hit.mp3');
  this.load.audio('arrow', 'sounds/arrow.mp3');
  this.load.audio('coin', 'sounds/coin.mp3');

  // Load music
  this.load.audio('forest_theme', 'music/forest_theme.mp3');
  this.load.audio('battle_theme', 'music/battle_theme.mp3');
}

create() {
  // Initialize audio helper after loading
  AudioHelper.init(this);
}
```

### Lazy Loading

```javascript
// Load music on demand for maps
const loadMapMusic = async (mapId) => {
  const track = getTrackForMap(mapId);

  if (!scene.cache.audio.exists(track)) {
    await new Promise(resolve => {
      scene.load.audio(track, `music/${track}.mp3`);
      scene.load.once('complete', resolve);
      scene.load.start();
    });
  }

  return track;
};
```

## Audio Format

### Supported Formats

| Format | Support | Use Case |
|--------|---------|----------|
| MP3 | Universal | Music, long sounds |
| OGG | Most browsers | Alternative format |
| WAV | Universal | Short SFX (uncompressed) |
| WebM | Modern browsers | Web-optimized |

### Format Fallbacks

```javascript
// Phaser handles format fallback
this.load.audio('hit', [
  'sounds/hit.mp3',
  'sounds/hit.ogg',
  'sounds/hit.wav'
]);
```

## Related Documentation

- [03-state-management.md](./03-state-management.md) - Audio settings storage
- [10-visual-effects.md](./10-visual-effects.md) - Synchronized effects
- [12-platform.md](./12-platform.md) - Platform audio considerations
