# UI System

This document covers the custom UI kit, DOM overlay system, and interactive components.

## UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      UI LAYER STACK                              │
└─────────────────────────────────────────────────────────────────┘

    Top (z-index: highest)
    ─────────────────────────────────────────────────────────────
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │              MODAL LAYER                            │  │
    │  │         (dialogs, popups)                           │  │
    │  └─────────────────────────────────────────────────────┘  │
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │            NOTIFICATION LAYER                       │  │
    │  │           (toasts, alerts)                          │  │
    │  └─────────────────────────────────────────────────────┘  │
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │              DOM UI LAYER                           │  │
    │  │     (buttons, sliders, inputs)                      │  │
    │  └─────────────────────────────────────────────────────┘  │
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │            PHASER CANVAS                            │  │
    │  │      (game world, sprites)                          │  │
    │  └─────────────────────────────────────────────────────┘  │
    ─────────────────────────────────────────────────────────────
    Bottom (z-index: lowest)
```

## @telazer/game-ui-kit

The game uses a custom UI component library built on DOM elements.

### Button Component

#### Button Configuration

```javascript
const defaultButtonConfig = {
  color: "green",           // Button color theme
  outline: true,            // Show border
  height: "default",        // Size preset
  font: "default",          // Font size preset
  type: "default",          // Button style type
  width: "auto",            // Width mode
  imageFillSize: 100,       // Image fill percentage
  pausable: true,           // Can be paused
  shadow: "default",        // Shadow style
  indicatorPosition: "top-left",
  indicatorLabel: "",
  indicatorPulse: true,
  hold: {
    delay: 270,             // ms before hold triggers
    repeat: 90              // ms between hold repeats
  },
  offset: { y: 0 },
  clickAnimation: "default"
};
```

#### Button Usage

```javascript
import { Button } from '@telazer/game-ui-kit';

// Create button
const myButton = Button.create({
  color: 'green',
  height: 'large',
  lines: [
    [{ text: 'Attack' }],
    [{ image: 'icons/sword.png' }]
  ],
  onClick: (button) => {
    console.log('Clicked!');
  },
  onHold: (button, iteration) => {
    console.log('Holding...', iteration);
  }
});

// Add to DOM
document.body.appendChild(myButton.element);
```

#### Button Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUTTON FEATURES                               │
│                                                                  │
│  Visual:                                                         │
│  ├── Color themes (green, red, blue, tan, etc.)                 │
│  ├── Size presets (small, default, large)                       │
│  ├── Shadow effects                                              │
│  ├── Nine-slice backgrounds                                      │
│  └── Indicator badges (pulsing notification dot)                │
│                                                                  │
│  Interaction:                                                    │
│  ├── Click events                                                │
│  ├── Hold/repeat (with configurable delay)                      │
│  ├── Keyboard shortcuts                                          │
│  ├── Touch support                                               │
│  └── Hover states                                                │
│                                                                  │
│  Cooldown:                                                       │
│  ├── Visual cooldown overlay                                     │
│  ├── Remaining time display                                      │
│  ├── Pause/resume support                                        │
│  └── Callback on complete                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Cooldown System

```javascript
// Start cooldown
button.startCoolDown(3000); // 3 seconds

// Cooldown with remaining time
button.startCoolDown(3000, 1500); // 3s total, 1.5s remaining

// Stop cooldown early
button.stopCoolDown();

// Pause/resume (respects game pause)
button.pauseCoolDown();
button.resumeCoolDown();

// Callbacks
const button = Button.create({
  onCoolDown: (button, remaining, delta) => {
    console.log(`${remaining}ms left`);
  },
  onCoolDownEnd: (button) => {
    console.log('Ready!');
  }
});
```

### Slider Component

```javascript
import { Slider } from '@telazer/game-ui-kit';

const volumeSlider = Slider.create({
  min: 0,
  max: 100,
  value: 80,
  step: 5,
  showValue: true,
  onChange: (value) => {
    audioHelper.setVolume(value / 100);
  }
});
```

### Notification (Notify) Component

```javascript
import { Notify } from '@telazer/game-ui-kit';

// Show notification
Notify.show({
  message: 'Level Up!',
  theme: 'blue',
  position: 'top',
  duration: 3000,
  animation: {
    duration: 300,
    delay: 100
  }
});

// Notification queue
// Multiple notifications are queued automatically
```

#### Notify Configuration

```javascript
const notifyConfig = {
  position: 'top',      // 'top', 'left', 'right'
  theme: 'blue',        // 'blue', 'red', 'tan'
  duration: 3000,       // ms to display
  animation: {
    duration: 300,      // fade in/out duration
    delay: 100          // delay between animations
  }
};
```

### Input Component

```javascript
import { Input } from '@telazer/game-ui-kit';

const nameInput = Input.create({
  placeholder: 'Enter name',
  value: '',
  maxLength: 20,
  onChange: (value) => {
    console.log('Input:', value);
  }
});
```

### Modal Component

```javascript
import { Modal } from '@telazer/game-ui-kit';

const confirmModal = Modal.create({
  title: 'Confirm Action',
  content: 'Are you sure?',
  buttons: [
    { text: 'Cancel', color: 'red', onClick: () => modal.close() },
    { text: 'Confirm', color: 'green', onClick: () => handleConfirm() }
  ]
});

confirmModal.open();
```

## DOM Element Structure

### Button HTML Structure

```html
<div class="button type-default width-auto color-green">
  <!-- Content area -->
  <div class="button_content in">
    <div class="button_line">
      <div class="button_line_item">
        <div class="button_line_item_image" style="background-image: url(...)"></div>
      </div>
      <div class="button_line_item">
        <div class="button_line_item_text">Attack</div>
      </div>
    </div>
  </div>

  <!-- Loading spinner (hidden by default) -->
  <div class="button_loading"></div>

  <!-- Keyboard shortcut indicator -->
  <div class="button_shortcut_wrapper position-top-right">
    <div class="button_shortcut">Q</div>
  </div>

  <!-- Notification indicator -->
  <div class="button_indicator_wrapper position-top-left">
    <div class="button_indicator pulse">!</div>
  </div>

  <!-- Cooldown overlay -->
  <div class="button_cooldown">
    <div class="button_cooldown_bg"></div>
    <div class="button_cooldown_left">
      <div class="button_cooldown_left_half"></div>
    </div>
    <div class="button_cooldown_right">
      <div class="button_cooldown_right_half"></div>
    </div>
    <div class="button_cooldown_text">3</div>
  </div>

  <!-- Background (nine-slice) -->
  <div class="button_background"></div>
</div>
```

## Nine-Slice Backgrounds

### Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                    NINE-SLICE SCALING                            │
│                                                                  │
│  Source Image:              Stretched Result:                    │
│  ┌───┬─────┬───┐           ┌───┬─────────────────┬───┐          │
│  │ 1 │  2  │ 3 │           │ 1 │        2        │ 3 │          │
│  ├───┼─────┼───┤           ├───┼─────────────────┼───┤          │
│  │ 4 │  5  │ 6 │    ==>    │   │                 │   │          │
│  ├───┼─────┼───┤           │ 4 │        5        │ 6 │          │
│  │ 7 │  8  │ 9 │           │   │                 │   │          │
│  └───┴─────┴───┘           ├───┼─────────────────┼───┤          │
│                            │ 7 │        8        │ 9 │          │
│  Corners (1,3,7,9):        └───┴─────────────────┴───┘          │
│  Never stretched                                                 │
│                                                                  │
│  Edges (2,4,6,8):                                               │
│  Stretched in one direction                                      │
│                                                                  │
│  Center (5):                                                     │
│  Stretched in both directions                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```javascript
// Nine-slice via @telazer/phaser-image-helper
const panel = ImageHelper.createNineSlice(scene, {
  key: 'ui_panel',
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  leftWidth: 16,
  rightWidth: 16,
  topHeight: 16,
  bottomHeight: 16
});
```

## Custom Cursors

### Cursor Assets

| Cursor | File | Usage |
|--------|------|-------|
| Default | `cursor_default.png` | Normal pointer |
| Pointer | `cursor_pointer.png` | Clickable elements |
| Grab | `cursor_grab.png` | Draggable items |
| Grabbing | `cursor_grabbing.png` | While dragging |
| Text | `cursor_text.png` | Text input |
| Hand | `cursor_hand.png` | Interactable |

### Cursor Implementation

```css
/* CSS cursor definitions */
.game-container {
  cursor: url('cursor/cursor_default.png'), auto;
}

.button:hover {
  cursor: url('cursor/cursor_pointer.png'), pointer;
}

.draggable {
  cursor: url('cursor/cursor_grab.png'), grab;
}

.dragging {
  cursor: url('cursor/cursor_grabbing.png'), grabbing;
}
```

## Text Rendering

### @telazer/phaser-text-helper

```javascript
import { TextHelper } from '@telazer/phaser-text-helper';

// Create Phaser text
const text = TextHelper.createText(scene, {
  x: 100,
  y: 50,
  text: 'Score: 1000',
  style: {
    fontFamily: 'PressStart2P',
    fontSize: '16px',
    color: '#ffffff'
  }
});

// Create DOM text (for UI overlay)
const domText = TextHelper.createDomText({
  x: 100,
  y: 50,
  text: 'Score: 1000',
  className: 'score-text'
});

// i18next integration
const localizedText = TextHelper.createText(scene, {
  x: 100,
  y: 50,
  text: t('ui.score', { value: 1000 })
});
```

### Custom Fonts

| Font | File | Usage |
|------|------|-------|
| BlinkyStar | `BlinkyStar.ttf` | Decorative |
| PressStart2P | `PressStart2P.ttf` | Pixel text |
| SVBasicManual | `SVBasicManual-Bold.otf` | UI text |
| SuperCartoon | `SuperCartoon.ttf` | Headers |

## Event Handling

### Button Events

```javascript
const button = Button.create({
  // Click event
  onClick: (button) => {
    performAction();
  },

  // Press event (on pointer down)
  onPress: (button) => {
    startCharging();
  },

  // Release event (on pointer up)
  onRelease: (button, holdIteration) => {
    releaseCharge(holdIteration);
  },

  // Hold event (repeated while holding)
  onHold: (button, iteration) => {
    chargeUp(iteration);
  },

  // Mouse enter/leave
  onMouseEnter: (button) => {
    showTooltip();
  },
  onMouseLeave: (button) => {
    hideTooltip();
  }
});

// Global button events
Button.onMouseEnter(() => {
  // Any button hovered
  game.scene.resume();
});

Button.onMouseLeave(() => {
  // No buttons hovered
});
```

### Global Pause

```javascript
// Pause all buttons
Button.pause();

// Resume all buttons
Button.resume();

// Check individual button state
if (button.isPaused) {
  // Button is paused
}
```

## Styling

### CSS Custom Properties

```css
/* Button color variables */
.button {
  --button-color-default: #4CAF50;
  --button-color-light: #81C784;
  --button-color-lighter: #A5D6A7;
  --button-color-dark: #388E3C;
  --button-color-darker: #1B5E20;

  --button-size: 48px;
  --button-font-size: 14px;
  --button-radius: 4px;
  --button-outline: 2px;
}
```

### Color Themes

| Theme | Default | Light | Dark |
|-------|---------|-------|------|
| Green | #4CAF50 | #81C784 | #388E3C |
| Red | #F44336 | #EF5350 | #D32F2F |
| Blue | #2196F3 | #64B5F6 | #1976D2 |
| Tan | #D7CCC8 | #EFEBE9 | #A1887F |

## Related Documentation

- [08-rendering.md](./08-rendering.md) - Canvas rendering
- [10-visual-effects.md](./10-visual-effects.md) - Animation effects
- [07-inventory.md](./07-inventory.md) - Inventory UI
