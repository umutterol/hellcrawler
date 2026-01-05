# HELLCRAWLER - UI Specification Document

## Version 1.1 | January 2025

> **Reference:** Desktop Heroes UI/UX patterns
> **Philosophy:** Game never pauses, menus overlay, idle-first design
> **Desktop Mode:** 350px horizontal strip, transparent window, bottom-docked

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

### Dimensions (Desktop Mode - 1920x350 base)

| Element | Width | Height | Position |
|---------|-------|--------|----------|
| Top Bar | 100% | 28px | Top |
| Sidebar | 40px | calc(100% - 28px - 60px) | Left |
| Game Area | calc(100% - 40px) | calc(100% - 28px - 60px) | Center-Right |
| Bottom Bar | 100% | 60px | Bottom |
| Sliding Panel | 525px | calc(100% - 28px - 60px) | Left (when open) |
| Ground Height | 100% | 60px | Bottom of game area |

> **Note:** Desktop Mode uses compact dimensions for the 350px tall horizontal strip layout. The game runs in a transparent, frameless window docked to the bottom of the screen.

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
| Open Duration | 300ms |
| Close Duration | 200ms |
| Ease Open | Cubic.easeOut |
| Ease Close | Cubic.easeIn |
| Panel slide | -525px → 0px (x position) |
| Panel remains static | Game area does NOT shift |
| Stagger | None (simultaneous) |

> **Note:** Panels slide in from off-screen left. The game area remains fixed - it does not shift when panels open.

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

**Purpose:** View tank info, upgrade tank stats, upgrade per-slot stats

**Architecture:** Tabbed interface with 6 tabs: Tank, Slot 1, Slot 2, Slot 3, Slot 4, Slot 5

```
┌─────────────────────────────────────┐
│ [<<]                    [🔊][🎵][?] │  ← Header with collapse + quick icons
├─────────────────────────────────────┤
│ ┌─────┐  HELLCRAWLER                │
│ │TANK │  Level 45                   │  ← Tank portrait + level
│ │ IMG │  ████████████░░ 12.5K/15K   │  ← XP bar
│ └─────┘                             │
├─────────────────────────────────────┤
│ [Tank][Slot1][Slot2][Slot3][S4][S5] │  ← Tab bar (locked slots show lock icon)
├─────────────────────────────────────┤
│                                     │
│  --- TANK TAB (Tank Stats) ---      │
│                                     │
│ ┌───┐                               │
│ │ ❤ │ Vitality (Max HP)             │
│ └───┘ Lv.25 → Lv.26                 │  ← Current → Next level
│       1,250 → 1,260 HP   [2,500 G]  │  ← Value preview + cost
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ 🛡 │ Barrier (Defense)             │
│ └───┘ Lv.15 → Lv.16                 │
│       15.0% → 15.5%      [1,500 G]  │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ 💚 │ Regeneration (HP Regen)       │
│ └───┘ Lv.10 → Lv.11                 │
│       5.0/s → 5.5/s      [1,000 G]  │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ 🐢 │ Suppression (Enemy Slow)      │
│ └───┘ Lv.12 → Lv.13                 │
│       12% → 13%          [1,200 G]  │
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│ [<<]                    [🔊][🎵][?] │
├─────────────────────────────────────┤
│ (Tank header - same as above)       │
├─────────────────────────────────────┤
│ [Tank][Slot1][Slot2][Slot3][S4][S5] │  ← Slot 1 tab selected
├─────────────────────────────────────┤
│                                     │
│  --- SLOT 1 TAB (Per-Slot Stats) ---│
│                                     │
│ ┌───┐ Equipped: Machine Gun (Rare)  │  ← Shows equipped module
│ │MG │ +5% Damage, +3% Attack Speed  │
│ └───┘                               │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ ⚔ │ Damage                        │
│ └───┘ Lv.25 → Lv.26                 │  ← Per-slot damage stat
│       +25% → +26%          [1,300G] │  ← Cost: (level+1) × 50
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ ⚡ │ Attack Speed                  │
│ └───┘ Lv.18 → Lv.19                 │  ← Per-slot attack speed stat
│       +18% → +19%          [950 G]  │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │ ⏱ │ Cooldown Reduction            │
│ └───┘ Lv.10 → Lv.11                 │  ← Per-slot CDR stat
│       10% → 11%            [550 G]  │  ← CDR capped at 90%
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│  --- LOCKED SLOT TAB (Slot 4) ---   │
├─────────────────────────────────────┤
│                                     │
│           🔒 LOCKED                 │
│                                     │
│     Unlock this slot in the Shop    │
│                                     │
│     Requirement: Beat Diaboros      │
│     Cost: 500,000 Gold              │
│                                     │
│         [Go to Shop]                │
│                                     │
└─────────────────────────────────────┘
```

**Tab Behavior:**
- Tank tab: Shows 4 tank stats (Vitality, Barrier, Regeneration, Suppression)
- Slot 1-5 tabs: Shows 3 per-slot stats (Damage, Attack Speed, CDR)
- Locked slots: Tab shows lock icon, content shows "Unlock in Shop" message
- Active tab has highlighted background

**Interactions:**
- Click tab → Switch to that tab's content
- Click upgrade button → Spend gold, upgrade that specific stat
- Hover button → Show affordability (green = can afford, brownish = can't)
- Locked slot tab → Click to see unlock requirements

**Button States:**
| State | Appearance |
|-------|------------|
| Can Afford | Green background, white text |
| Cannot Afford | Brownish background (#5a4a37), shows cost |
| At Max Level | Gray background, "MAX" text |
| Locked Slot | Dark background, lock icon, "Unlock in Shop" |

**Per-Slot Stat Formulas:**
| Stat | Effect | Formula |
|------|--------|---------|
| Damage | +1% per level | 1 + (level × 0.01) multiplier |
| Attack Speed | +1% per level | 1 + (level × 0.01) multiplier |
| CDR | +1% per level | min(level%, 90%) reduction |

**Upgrade Cost:** (Current Level + 1) × 50 Gold

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
│ ┌────┬────┬────┬────┬────┬────┬────┬────┐  │
│ │ MG │ MG │MSL │TES │REP │FLM │EMP │MOR │  │  ← 8-column grid
│ │ U  │ R  │ R  │ E  │ U  │ E  │ L  │ R  │  │  ← Rarity indicator
│ ├────┼────┼────┼────┼────┼────┼────┼────┤  │
│ │ MG │MSL │    │    │    │    │    │    │  │
│ │ U  │ E  │    │    │    │    │    │    │  │
│ ├────┼────┼────┼────┼────┼────┼────┼────┤  │
│ │    │    │    │    │    │    │    │    │  │  ← Empty slots
│ │    │    │    │    │    │    │    │    │  │
│ └────┴────┴────┴────┴────┴────┴────┴────┘  │
│ [< PREV]     Page 1 / 2     [NEXT >]       │  ← Pagination
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

**Pagination (Desktop Mode):**
| Property | Value |
|----------|-------|
| Grid Size | 8 columns × 4 rows |
| Items Per Page | 32 |
| Max Inventory | 50 |
| Total Pages | 2 (ceil(50/32)) |

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

**Note:** Slots 1 and 2 (indices 0 and 1) are always free and start unlocked. Shop only shows purchasable slots 3, 4, and 5 (indices 2, 3, 4).

```
┌─────────────────────────────────────┐
│ [<<]                         SHOP   │
├─────────────────────────────────────┤
│ MODULE SLOTS         Gold: 15,000   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 3             FRONT →      │ │  ← Direction indicator
│ │ Unlocks 3rd module slot         │ │
│ │                                 │ │
│ │ [PURCHASE: 10,000 G]            │ │  ← 10K gold
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 4             ← BACK       │ │
│ │ Unlocks 4th module slot         │ │
│ │                                 │ │
│ │ [PURCHASE: 20,000 G]            │ │  ← 20K gold
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SLOT 5             ⟷ CENTER     │ │  ← LOCKED until Act 6
│ │ Unlocks center turret           │ │
│ │                                 │ │
│ │ 🔒 Reach Act 6                  │ │
│ │ Cost: 75,000 G                  │ │  ← 75K gold
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Slot Costs (Center Tank Design):**
| Slot | Index | Direction | Cost | Requirement |
|------|-------|-----------|------|-------------|
| Slot 1 | 0 | FRONT → | Free | None (starts unlocked) |
| Slot 2 | 1 | ← BACK | Free | None (starts unlocked) |
| Slot 3 | 2 | FRONT → | 10,000 G | Gold only |
| Slot 4 | 3 | ← BACK | 20,000 G | Gold only |
| Slot 5 | 4 | ⟷ CENTER | 75,000 G | Reach Act 6 |

**Button States:**
| State | Appearance |
|-------|------------|
| Owned | Gray, "✓ Unlocked" |
| Available + Affordable | Green, "PURCHASE: X G" |
| Available + Cannot Afford | Orange, shows "Need X more" |
| Locked | Dark, shows requirement + future cost |

**Pagination (Desktop Mode):**
| Property | Value |
|----------|-------|
| Cards Per Page | 3 |
| Total Purchasable Slots | 3 |
| Total Pages | 1 |

> **Note:** All 3 purchasable slots (3, 4, 5) fit on a single page.

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
│ DESKTOP MODE (Electron only)        │
├─────────────────────────────────────┤
│ Always on Top              [✓]     │
│ Click-Through              [✓]     │
│                                     │
│ LAYER VISIBILITY                    │
│ Sky & Clouds               [✓]     │
│ Mountains                  [✓]     │
│ Far Buildings              [✓]     │
│ Forest & Town              [✓]     │
├─────────────────────────────────────┤
│                                     │
│      [SAVE GAME]                    │
│                                     │
│      [SAVE & QUIT TO MENU]          │
│                                     │
└─────────────────────────────────────┘
```

**Desktop Mode Settings (Electron only):**
| Setting | Default | Description |
|---------|---------|-------------|
| Always on Top | ON | Keep game window above other applications |
| Click-Through | ON | Mouse clicks pass through transparent areas to desktop |
| Sky & Clouds | ON | Toggle bg-sky and bg-clouds layers |
| Mountains | ON | Toggle bg-mountains and bg-mountains-lights layers |
| Far Buildings | ON | Toggle bg-far-buildings layer |
| Forest & Town | ON | Toggle bg-forest and bg-town layers |

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
│   ←      ←      ⟷      →      →                                    │
│ [Slot2] [Slot4] [Slot5] [Slot3] [Slot1]        [Wave 5/7] [▶] [⏸]  │
│  BACK    BACK   CENTER  FRONT   FRONT                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Note:** Slots are displayed in spatial order matching their firing direction:
- Left side: Back slots (1, 3) attack enemies from the left
- Center: Slot 5 attacks enemies from both sides
- Right side: Front slots (0, 2) attack enemies from the right

**HP Bar:**
- Full width minus padding
- Shows current/max values
- Color changes: Green (>50%) → Yellow (25-50%) → Red (<25%)
- Near Death: Pulsing red + "REVIVE" button appears

**Module Slots (Center Tank Design):**
- 5 slots in row, visually ordered: [← Back] [← Back] [⟷ Center] [Front →] [Front →]
- Display order: Slot 2, Slot 4, Slot 5, Slot 3, Slot 1 (indices: 1, 3, 4, 2, 0)
- Direction indicators: ← (attacks left), → (attacks right), ⟷ (attacks both)
- Color coding: Red (←), Cyan (→), Gold (⟷)
- Each shows: Module icon, slot level, skill cooldowns, direction indicator
- Click to select (shows tooltip with stats)
- Skill buttons appear below selected slot

**Slot Directions:**
| Visual Position | Slot Index | Direction | Color | Fires At |
|-----------------|------------|-----------|-------|----------|
| 1 (leftmost) | 1 | ← | #ff6b6b (red) | Left enemies |
| 2 | 3 | ← | #ff6b6b (red) | Left enemies |
| 3 (center) | 4 | ⟷ | #ffd700 (gold) | Both sides |
| 4 | 2 | → | #4ecdc4 (cyan) | Right enemies |
| 5 (rightmost) | 0 | → | #4ecdc4 (cyan) | Right enemies |

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

**Document Version:** 1.1
**Last Updated:** January 2025
**Status:** APPROVED FOR IMPLEMENTATION

---

## Changelog

### v1.2 (January 2025)
- **Center Tank Design:** Added bidirectional combat with direction indicators
- Updated Bottom Bar to show slot display order matching firing directions
- Added direction labels (←/→/⟷) to slots in all UI components
- Updated Shop Panel with new slot costs (Slots 1-2 free, Slot 3: 10K, Slot 4: 20K, Slot 5: 75K + Act 6)
- Added slot direction color coding (Red=←, Cyan=→, Gold=⟷)
- Updated Tank Stats panel tabs with direction indicators
- Updated Inventory panel equipped slots with direction indicators

### v1.1 (January 2025)
- Updated dimensions for Desktop Mode (350px height, compact UI)
- Changed panel width from 400px to 525px
- Added Desktop Mode settings section (Always on Top, Click-Through, Layer Visibility)
- Added pagination for Inventory (8x4 grid, 32 items/page) and Shop (3 cards/page)
- Updated animation timing (separate open/close durations)
- Clarified that game area does NOT shift when panels open

### v1.0 (December 2024)
- Initial specification document
