# HELLCRAWLER - UI Specification Document
## Version 1.0 | December 2024

> **Reference:** Desktop Heroes UI/UX patterns
> **Philosophy:** Game never pauses, menus overlay, idle-first design

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Screen Layout](#2-screen-layout)
3. [Sliding Panel System](#3-sliding-panel-system)
4. [Panel Specifications](#4-panel-specifications)
5. [HUD Elements](#5-hud-elements)
6. [Interaction Patterns](#6-interaction-patterns)
7. [Visual Design](#7-visual-design)
8. [Animation Specifications](#8-animation-specifications)
9. [Responsive Behavior](#9-responsive-behavior)
10. [Implementation Architecture](#10-implementation-architecture)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Idle-First** | Game continues running during ALL menu interactions |
| **No Scene Transitions** | All UI is overlay-based, no black screen transitions |
| **Always Accessible** | Core actions (skills, flee) always visible |
| **Progressive Disclosure** | Complex info hidden until needed |
| **One-Click Actions** | Upgrades, equips, sells - single click |

### Anti-Patterns (DO NOT)

- ❌ Pause the game when opening menus
- ❌ Use separate Phaser scenes for menus
- ❌ Hide the game area completely
- ❌ Require multiple clicks for common actions
- ❌ Use modal dialogs that block gameplay

---

## 2. Screen Layout

### Base Layout (No Panels Open)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                             │
│ [Gold: 1.2M] [+5.2K/s]  [LVL 45 ████████░░ XP]    [Zone 1-2] [Flee]│
├──┬──────────────────────────────────────────────────────────────────┤
│  │                                                                  │
│S │                                                                  │
│I │                         GAME AREA                                │
│D │     [TANK] ←←← enemies approach ←←←              [ENEMIES]      │
│E │                                                                  │
│B │                    Damage numbers float up                       │
│A │                                                                  │
│R │                                                                  │
│  │                                                                  │
├──┴──────────────────────────────────────────────────────────────────┤
│ BOTTOM BAR                                                          │
│ [HP ████████████░░░░] 235K/300K    [Near Death: REVIVE]            │
│ [Slot1][Slot2][Slot3][Slot4][Slot5]              [Wave 5/7 ▶][⏸]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout With Panel Open

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOP BAR (shifts right with game area)                               │
│              [Gold: 1.2M] [+5.2K/s]  [LVL 45]        [Zone] [Flee] │
├──────────────────┬──┬────────────────────────────────────────────────┤
│                  │  │                                                │
│  SLIDING PANEL   │S │                                                │
│  (~400px wide)   │I │           GAME AREA                            │
│                  │D │        (compressed but visible)                │
│  [<<] to close   │E │                                                │
│                  │B │     [TANK] ←← enemies ←←                       │
│  Panel content   │A │                                                │
│  here...         │R │                                                │
│                  │  │                                                │
├──────────────────┴──┴────────────────────────────────────────────────┤
│ BOTTOM BAR (shifts right with game area)                            │
│              [HP Bar]        [Slot1][Slot2][Slot3]    [Wave 5/7]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Dimensions (1920x1080 base)

| Element | Width | Height | Position |
|---------|-------|--------|----------|
| Top Bar | 100% | 48px | Top |
| Sidebar | 56px | calc(100% - 48px - 120px) | Left |
| Game Area | calc(100% - 56px) | calc(100% - 48px - 120px) | Center-Right |
| Bottom Bar | 100% | 120px | Bottom |
| Sliding Panel | 400px | calc(100% - 48px - 120px) | Left (when open) |

---

## 3. Sliding Panel System

### Panel States

```
CLOSED                    OPENING                   OPEN
┌──┬─────────┐           ┌──────┬──┬──────┐        ┌────────┬──┬────┐
│SB│ GAME    │    →      │PANEL │SB│ GAME │   →    │ PANEL  │SB│GAME│
│  │         │           │      │  │      │        │        │  │    │
└──┴─────────┘           └──────┴──┴──────┘        └────────┴──┴────┘
```

### Animation Timing

| Property | Value |
|----------|-------|
| Duration | 300ms |
| Easing | Cubic.easeOut |
| Panel slide | 0px → 400px (x position) |
| Game area shift | 0px → 400px (x offset) |
| Stagger | None (simultaneous) |

### Panel Stack Rules

1. **Only ONE panel open at a time**
2. Clicking different sidebar icon closes current, opens new
3. Clicking same icon toggles (closes if open)
4. Clicking "<<" or pressing ESC closes current panel
5. Clicking in game area closes panel

### Sidebar Icons

| Order | Icon | Panel | Shortcut |
|-------|------|-------|----------|
| 1 | Tank silhouette | Tank Stats Panel | TAB |
| 2 | Backpack/Bag | Module Inventory Panel | I |
| 3 | Shopping cart | Shop Panel | P |
| 4 | Cogwheel | Settings Panel | ESC (toggle) |

---

## 4. Panel Specifications

### 4.1 Tank Stats Panel

**Purpose:** View tank info, upgrade stats, upgrade module slots

```
┌─────────────────────────────────────┐
│ [<<]                    [🔊][🎵][?] │  ← Header with collapse + quick icons
├─────────────────────────────────────┤
│ ┌─────┐  HELLCRAWLER                │
│ │TANK │  Level 45                   │  ← Tank portrait + level
│ │ IMG │  ████████████░░ 12.5K/15K   │  ← XP bar
│ └─────┘                             │
├─────────────────────────────────────┤
│ ⚙ TANK STATS           [UPGRADE]   │  ← Section header
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ ❤ │ Max HP                        │
│ └───┘ 1,250 → 1,260                 │  ← Current → Next
│       [+10 HP]            [500 G]   │  ← Upgrade button with cost
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ 🛡 │ Defense                       │
│ └───┘ 15.5% → 16.0%                 │
│       [+0.5%]             [600 G]   │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ 💚 │ HP Regen                      │
│ └───┘ 5.5/s → 6.0/s                 │
│       [+0.5/s]            [700 G]   │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ 🐢 │ Enemy Slow                    │
│ └───┘ 12% → 13%                     │
│       [+1%]               [800 G]   │
├─────────────────────────────────────┤
│ ⚙ MODULE SLOTS                      │  ← Section header
├─────────────────────────────────────┤
│ Slot 1  [Lv.25]  ████░░  [1,000 G]  │  ← Slot level + upgrade
│ Slot 2  [Lv.18]  ███░░░  [900 G]    │
│ Slot 3  [Lv.10]  ██░░░░  [550 G]    │
│ Slot 4  [LOCKED - Beat Diaboros]    │  ← Locked slots show requirement
│ Slot 5  [LOCKED - Beat all Ubers]   │
└─────────────────────────────────────┘
```

**Interactions:**
- Click cost button → Spend gold, upgrade stat/slot
- Hover cost button → Show affordability (green = can afford, red = can't)
- Click [UPGRADE] header → Toggle between stats/slots view (optional)

**Button States:**
| State | Appearance |
|-------|------------|
| Can Afford | Green background, white text |
| Cannot Afford | Gray background, orange text showing "Need X more" |
| At Max Level | Gray background, "MAX" text |
| Locked | Dark background, lock icon, requirement text |

---

### 4.2 Module Inventory Panel

**Purpose:** View modules, equip/unequip, sell, compare

```
┌─────────────────────────────────────┐
│ [<<]              [Auto-Sell ⚙][🗑] │  ← Header with auto-sell toggle
├─────────────────────────────────────┤
│ EQUIPPED MODULES                    │
│ ┌─────┬─────┬─────┬─────┬─────┐    │
│ │ MG  │ MSL │ REP │  🔒 │  🔒 │    │  ← 5 equipment slots
│ │Lv25 │Lv18 │Lv10 │     │     │    │
│ └─────┴─────┴─────┴─────┴─────┘    │
├─────────────────────────────────────┤
│ INVENTORY (24/50)      [Sort ▼]    │  ← Item count + sort dropdown
├─────────────────────────────────────┤
│ ┌────┬────┬────┬────┬────┬────┐    │
│ │ MG │ MG │MSL │TES │REP │FLM │    │  ← 6-column grid
│ │ U  │ R  │ R  │ E  │ U  │ E  │    │  ← Rarity indicator
│ ├────┼────┼────┼────┼────┼────┤    │
│ │EMP │MOR │ MG │MSL │    │    │    │
│ │ L  │ R  │ U  │ E  │    │    │    │
│ ├────┼────┼────┼────┼────┼────┤    │
│ │    │    │    │    │    │    │    │  ← Empty slots
│ │    │    │    │    │    │    │    │
│ └────┴────┴────┴────┴────┴────┘    │
│           [▲ Scroll ▼]              │
├─────────────────────────────────────┤
│ SELECTED: Machine Gun (Rare)        │  ← Selection detail
│ ┌─────────────────────────────────┐ │
│ │ +5% Damage                      │ │  ← Stats list
│ │ +3% Attack Speed                │ │
│ └─────────────────────────────────┘ │
│ [EQUIP →]  [SELL: 200G]  [COMPARE]  │  ← Action buttons
└─────────────────────────────────────┘
```

**Grid Item Display:**
```
┌────────┐
│ [ICON] │  ← Module type icon
│  MG    │  ← Abbreviated name
├────────┤
│ ★ R    │  ← Rarity: U/R/E/L with color
└────────┘
```

**Rarity Colors:**
| Rarity | Color | Border |
|--------|-------|--------|
| Uncommon | #4ade80 (green) | 1px solid |
| Rare | #60a5fa (blue) | 2px solid |
| Epic | #c084fc (purple) | 2px solid + glow |
| Legendary | #fb923c (orange) | 3px solid + glow + particle |

**Interactions:**
- Click inventory item → Select (show details below)
- Double-click inventory item → Equip to first empty slot
- Click equipped module → Select (show details)
- Double-click equipped module → Unequip to inventory
- Drag from inventory to slot → Equip
- Drag from slot to inventory → Unequip
- Click [EQUIP →] → Opens slot selector if multiple available
- Click [SELL] → Sell for gold (with confirmation for Rare+)
- Click [COMPARE] → Show side-by-side with currently equipped
- Right-click → Context menu (Equip, Sell, Lock, Compare)

**Sort Options:**
- Rarity (High → Low)
- Rarity (Low → High)
- Type (A → Z)
- Recently Acquired

**Auto-Sell Feature:**
- Toggle auto-sell on/off
- Configure: "Auto-sell Uncommon" checkbox
- Shows count of items that would be sold

---

### 4.3 Shop Panel

**Purpose:** Purchase module slots, view unlock requirements

```
┌─────────────────────────────────────┐
│ [<<]                         SHOP   │
├─────────────────────────────────────┤
│ MODULE SLOTS                        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 1                    FREE  │ │  ← Already owned
│ │ ✓ Unlocked                      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 2                          │ │
│ │ Unlocks 2nd module slot         │ │
│ │                                 │ │
│ │ [PURCHASE: 10,000 G]            │ │  ← Purchasable
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 3                          │ │
│ │ Unlocks 3rd module slot         │ │
│ │                                 │ │
│ │ [PURCHASE: 50,000 G]            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 4                   LOCKED │ │  ← Locked with requirement
│ │ Unlocks 4th module slot         │ │
│ │                                 │ │
│ │ 🔒 Defeat Diaboros (Act 8)      │ │
│ │ Cost: 500,000 G                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 5                   LOCKED │ │
│ │ Unlocks 5th module slot         │ │
│ │                                 │ │
│ │ 🔒 Defeat all Uber Bosses       │ │
│ │ Cost: 2,000,000 G               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Button States:**
| State | Appearance |
|-------|------------|
| Owned | Gray, "✓ Unlocked" |
| Available + Affordable | Green, "PURCHASE: X G" |
| Available + Cannot Afford | Orange, shows "Need X more" |
| Locked | Dark, shows requirement + future cost |

---

### 4.4 Settings Panel

**Purpose:** Game options, audio, display, save/quit

```
┌─────────────────────────────────────┐
│ [<<]                     SETTINGS   │
├─────────────────────────────────────┤
│ [🔊][🎵][❓][💾]                    │  ← Quick toggles row
│  SFX Music Help Save                │
├─────────────────────────────────────┤
│ DISPLAY                             │
├─────────────────────────────────────┤
│ Show Health Bars            [✓]    │
│ Show Damage Numbers         [✓]    │
│ Show Enemy HP Text          [✓]    │
│ Show VFX                    [✓]    │
├─────────────────────────────────────┤
│ GAMEPLAY                            │
├─────────────────────────────────────┤
│ Auto-Collect Loot           [✓]    │
│ Confirm Rare+ Sells         [✓]    │
│ Show Tooltips               [✓]    │
├─────────────────────────────────────┤
│ AUDIO                               │
├─────────────────────────────────────┤
│ Master Volume      [━━━━━━━●━━] 80% │
│ Music Volume       [━━━━━●━━━━] 60% │
│ SFX Volume         [━━━━━━━━●━] 90% │
├─────────────────────────────────────┤
│ CONTROLS                            │
├─────────────────────────────────────┤
│ Skill Keys: 1-10                    │
│ Auto-Mode: Shift + Key              │
│ Tank Stats: TAB                     │
│ Inventory: I                        │
│ Shop: P                             │
│ Settings: ESC                       │
├─────────────────────────────────────┤
│                                     │
│      [SAVE GAME]                    │
│                                     │
│      [SAVE & QUIT TO MENU]          │
│                                     │
└─────────────────────────────────────┘
```

**Toggle States:**
- [✓] = Enabled (green checkmark)
- [✗] = Disabled (red X)

**Slider Interaction:**
- Click anywhere on track → Jump to position
- Drag handle → Smooth adjustment
- Shows percentage value

---

## 5. HUD Elements

### 5.1 Top Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ [💰 1.2M] [+5.2K/s]    [LVL 45 ████████░░ 12.5K/15K XP]   [Zone 1-2] [Flee] │
└─────────────────────────────────────────────────────────────────────┘
```

| Element | Description | Position |
|---------|-------------|----------|
| Gold | Current gold with icon | Left |
| Gold/s | Gold income rate | Left (after gold) |
| Level | Tank level number | Center-Left |
| XP Bar | Progress to next level | Center |
| Zone | Current Act-Zone | Right |
| Flee | Emergency retreat button | Far Right |

### 5.2 Sidebar

```
┌──┐
│🛡️│ ← Tank Stats (TAB)
├──┤
│📦│ ← Inventory (I)
├──┤
│🛒│ ← Shop (P)
├──┤
│⚙️│ ← Settings (ESC)
└──┘
```

- Width: 56px
- Icon size: 40x40px
- Padding: 8px
- Active state: Highlighted background
- Hover state: Slight scale + glow

### 5.3 Bottom Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ [HP ████████████░░░░] 235,000/300,000                               │
│ [Slot1] [Slot2] [Slot3] [Slot4] [Slot5]        [Wave 5/7] [▶] [⏸]  │
└─────────────────────────────────────────────────────────────────────┘
```

**HP Bar:**
- Full width minus padding
- Shows current/max values
- Color changes: Green (>50%) → Yellow (25-50%) → Red (<25%)
- Near Death: Pulsing red + "REVIVE" button appears

**Module Slots:**
- 5 slots in row
- Each shows: Module icon, slot level, skill cooldowns
- Click to select (shows tooltip with stats)
- Skill buttons appear below selected slot

**Wave Progress:**
- Shows current wave / total waves
- Play button: Start next wave (if waiting)
- Pause button: Doesn't pause game, just delays next wave auto-start

### 5.4 Near Death Overlay

When tank enters Near Death state:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ⚠️ NEAR DEATH ⚠️                            │
│                     Attack Speed -50%                               │
│                                                                     │
│                    Auto-revive in: 45s                              │
│                                                                     │
│                    [ REVIVE NOW ]                                   │
└─────────────────────────────────────────────────────────────────────┘
```

- Semi-transparent red overlay on game area
- Pulsing animation
- Large "REVIVE NOW" button
- Countdown timer
- Does NOT block sidebar access

---

## 6. Interaction Patterns

### 6.1 Click Behaviors

| Target | Single Click | Double Click | Right Click |
|--------|--------------|--------------|-------------|
| Sidebar icon | Open/toggle panel | - | - |
| Inventory item | Select | Equip | Context menu |
| Equipped module | Select | Unequip | Context menu |
| Upgrade button | Purchase upgrade | - | - |
| Skill button | Activate skill | - | Toggle auto-mode |
| Game area (panel open) | Close panel | - | - |

### 6.2 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| TAB | Toggle Tank Stats panel |
| I | Toggle Inventory panel |
| P | Toggle Shop panel |
| ESC | Close panel OR open Settings |
| 1-10 | Activate skill |
| Shift + 1-10 | Toggle skill auto-mode |
| Space | Start next wave (if waiting) |

### 6.3 Drag & Drop

| Source | Target | Action |
|--------|--------|--------|
| Inventory module | Equipment slot | Equip module |
| Equipment slot | Inventory area | Unequip module |
| Inventory module | Trash icon | Sell module |

---

## 7. Visual Design

### 7.1 Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Panel Background | Dark Brown | #2d1f1a |
| Panel Border | Gold/Bronze | #8b7355 |
| Button Default | Dark Gray | #3d3d3d |
| Button Hover | Medium Gray | #5d5d5d |
| Button Active | Gold | #c9a227 |
| Text Primary | Off-White | #f5f5f5 |
| Text Secondary | Light Gray | #a0a0a0 |
| Gold Currency | Gold | #ffd700 |
| Health Green | Green | #4ade80 |
| Health Yellow | Yellow | #facc15 |
| Health Red | Red | #ef4444 |
| Uncommon | Green | #4ade80 |
| Rare | Blue | #60a5fa |
| Epic | Purple | #c084fc |
| Legendary | Orange | #fb923c |

### 7.2 Typography

| Usage | Font | Size | Weight |
|-------|------|------|--------|
| Panel Headers | Pixel Font | 24px | Bold |
| Section Headers | Pixel Font | 18px | Bold |
| Body Text | Pixel Font | 14px | Normal |
| Numbers (Currency) | Pixel Font | 16px | Bold |
| Tooltips | Pixel Font | 12px | Normal |

### 7.3 Iconography

- All icons: 32x32px or 40x40px
- Style: Pixel art, matching game aesthetic
- States: Normal, Hover (brightened), Disabled (desaturated)

---

## 8. Animation Specifications

### 8.1 Panel Animations

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Panel Open | 300ms | Cubic.easeOut | x: -400 → 0 |
| Panel Close | 250ms | Cubic.easeIn | x: 0 → -400 |
| Game Shift Right | 300ms | Cubic.easeOut | x: 0 → 400 |
| Game Shift Left | 250ms | Cubic.easeIn | x: 400 → 0 |

### 8.2 Button Animations

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Hover Scale | 100ms | Linear | scale: 1 → 1.05 |
| Click Scale | 50ms | Linear | scale: 1 → 0.95 → 1 |
| Afford Pulse | 1000ms | Sine.inOut | alpha: 1 → 0.7 → 1 (loop) |

### 8.3 Notification Animations

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Gold Gained | 1500ms | Cubic.easeOut | y: 0 → -30, alpha: 1 → 0 |
| Level Up | 500ms | Bounce.easeOut | scale: 0 → 1.2 → 1 |
| Item Acquired | 300ms | Back.easeOut | scale: 0 → 1 |

---

## 9. Responsive Behavior

### 9.1 Resolution Scaling

| Resolution | Panel Width | Game Area |
|------------|-------------|-----------|
| 1920x1080 | 400px | 100% - 56px - 400px |
| 1600x900 | 350px | Scaled proportionally |
| 1280x720 | 300px | Scaled proportionally |

### 9.2 Panel Behavior at Low Res

At resolutions below 1280px wide:
- Panel covers more of game area (up to 60%)
- Game area scales down but remains visible
- Consider: Panel becomes full-screen overlay with semi-transparent game behind

---

## 10. Implementation Architecture

### 10.1 Class Structure

```typescript
// Base panel class
abstract class SlidingPanel extends Phaser.GameObjects.Container {
  protected isOpen: boolean = false;
  protected panelWidth: number = 400;

  abstract createContent(): void;
  abstract refresh(): void;

  open(): void;
  close(): void;
  toggle(): void;
}

// Panel implementations
class TankStatsPanel extends SlidingPanel { }
class InventoryPanel extends SlidingPanel { }
class ShopPanel extends SlidingPanel { }
class SettingsPanel extends SlidingPanel { }

// Panel manager (singleton)
class PanelManager {
  private activePanel: SlidingPanel | null = null;
  private panels: Map<string, SlidingPanel>;

  openPanel(panelId: string): void;
  closeCurrentPanel(): void;
  togglePanel(panelId: string): void;
}

// Sidebar
class Sidebar extends Phaser.GameObjects.Container {
  private buttons: SidebarButton[];

  setActiveButton(index: number): void;
  clearActiveButton(): void;
}
```

### 10.2 Scene Structure

```typescript
// Single GameScene contains everything
class GameScene extends Phaser.Scene {
  // Game elements
  private tank: Tank;
  private enemies: Phaser.GameObjects.Group;
  private projectiles: Phaser.GameObjects.Group;

  // UI Layer (on top of game)
  private uiContainer: Phaser.GameObjects.Container;
  private topBar: TopBar;
  private bottomBar: BottomBar;
  private sidebar: Sidebar;

  // Panel Layer (on top of UI)
  private panelManager: PanelManager;

  // Camera
  private gameCamera: Phaser.Cameras.Scene2D.Camera;
  private uiCamera: Phaser.Cameras.Scene2D.Camera;
}
```

### 10.3 Camera Setup

```typescript
// Game camera - shifts when panel opens
this.gameCamera = this.cameras.main;
this.gameCamera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

// UI camera - fixed, ignores panel shifts
this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
this.uiCamera.setScroll(0, 0);

// Panel elements follow UI camera
this.sidebar.setScrollFactor(0);
this.topBar.setScrollFactor(0);
this.bottomBar.setScrollFactor(0);
```

### 10.4 Event Flow

```
User clicks Sidebar Icon
        ↓
PanelManager.togglePanel(panelId)
        ↓
    ┌───────────────────────────────────┐
    │ Is another panel open?            │
    │   Yes → Close it first            │
    │   No  → Continue                  │
    └───────────────────────────────────┘
        ↓
    ┌───────────────────────────────────┐
    │ Is this panel already open?       │
    │   Yes → Close it                  │
    │   No  → Open it                   │
    └───────────────────────────────────┘
        ↓
Animate panel + game area
        ↓
Update sidebar active state
        ↓
Panel.refresh() to update content
```

---

## Appendix A: Asset Requirements

### Icons Needed

| Icon | Size | Usage |
|------|------|-------|
| tank-portrait | 64x64 | Tank stats panel |
| icon-hp | 32x32 | HP stat |
| icon-defense | 32x32 | Defense stat |
| icon-regen | 32x32 | HP regen stat |
| icon-slow | 32x32 | Enemy slow stat |
| icon-gold | 24x24 | Currency display |
| icon-xp | 24x24 | XP display |
| sidebar-tank | 40x40 | Sidebar button |
| sidebar-inventory | 40x40 | Sidebar button |
| sidebar-shop | 40x40 | Sidebar button |
| sidebar-settings | 40x40 | Sidebar button |
| btn-collapse | 32x32 | Panel collapse |
| module-icons | 48x48 each | Module type icons |
| rarity-frames | 56x56 each | Inventory item frames |

### Audio Needed

| Sound | Usage |
|-------|-------|
| ui-click | Button press |
| ui-open | Panel open |
| ui-close | Panel close |
| ui-purchase | Upgrade/buy success |
| ui-error | Cannot afford |
| ui-equip | Module equipped |
| ui-sell | Module sold |

---

## Appendix B: State Persistence

### What Persists Across Sessions

- Panel open/closed state: NO (always start closed)
- Scroll positions: NO (reset to top)
- Sort preferences: YES (save to localStorage)
- Settings toggles: YES (save to localStorage)
- Auto-sell preferences: YES (save to localStorage)

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Status:** APPROVED FOR IMPLEMENTATION
