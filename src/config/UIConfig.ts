/**
 * UI Configuration Constants
 * Centralized constants for the sliding panel UI system
 * Based on UISpec.md specifications
 */

export const UI_CONFIG = {
  // Screen dimensions (reference) - Desktop Heroes style
  WIDTH: 1920,
  HEIGHT: 350,

  // Depth layers
  DEPTHS: {
    GAME: 0,
    HUD: 100,
    SIDEBAR: 150,
    PANEL: 200,
    PANEL_CONTENT: 201,
    OVERLAY: 300,
    MODAL: 400,
  },

  // Sidebar - Compact for short window
  SIDEBAR: {
    WIDTH: 40,
    ICON_SIZE: 28,
    PADDING: 6,
    TOP_OFFSET: 28, // Below top bar
    BOTTOM_OFFSET: 60, // Above bottom bar
  },

  // Sliding Panel - 50% wider for better content layout
  PANEL: {
    WIDTH: 525,
    OPEN_DURATION: 300,
    CLOSE_DURATION: 250,
    EASE_OPEN: 'Cubic.easeOut',
    EASE_CLOSE: 'Cubic.easeIn',
  },

  // Top Bar - Compact for Desktop Heroes style
  TOP_BAR: {
    HEIGHT: 28,
  },

  // Bottom Bar - Compact for Desktop Heroes style
  BOTTOM_BAR: {
    HEIGHT: 60,
  },

  // Colors (from UISpec.md)
  COLORS: {
    PANEL_BACKGROUND: 0x2d1f1a,
    PANEL_BORDER: 0x8b7355,
    BUTTON_DEFAULT: 0x3d3d3d,
    BUTTON_HOVER: 0x5d5d5d,
    BUTTON_ACTIVE: 0xc9a227,
    BUTTON_DISABLED: 0x2a2a2a,
    TEXT_PRIMARY: '#f5f5f5',
    TEXT_SECONDARY: '#a0a0a0',
    TEXT_GOLD: '#ffd700',
    HEALTH_GREEN: 0x4ade80,
    HEALTH_YELLOW: 0xfacc15,
    HEALTH_RED: 0xef4444,
    RARITY_UNCOMMON: 0x4ade80,
    RARITY_RARE: 0x60a5fa,
    RARITY_EPIC: 0xc084fc,
    RARITY_LEGENDARY: 0xfb923c,
    SIDEBAR_BG: 0x1a1a2e,
    SIDEBAR_ACTIVE: 0x3d3d5c,
    SIDEBAR_HOVER: 0x2d2d44,
  },

  // Typography - Compact for Desktop Heroes style
  FONTS: {
    HEADER: {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#f5f5f5',
    },
    SECTION_HEADER: {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#f5f5f5',
    },
    BODY: {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#f5f5f5',
    },
    SMALL: {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#a0a0a0',
    },
  },
  // Slot direction labels and icons for bidirectional combat UI
  SLOT_DIRECTIONS: {
    // Direction labels
    LABELS: {
      left: '← BACK',
      right: 'FRONT →',
      both: '⟷ CENTER',
    },
    // Short labels for compact displays
    SHORT_LABELS: {
      left: '←',
      right: '→',
      both: '⟷',
    },
    // Colors for direction indicators
    COLORS: {
      left: 0xff6b6b,   // Red-ish for back/left
      right: 0x4ecdc4,  // Cyan-ish for front/right
      both: 0xffd700,   // Gold for center/both
    },
    // Hex colors for text
    HEX_COLORS: {
      left: '#ff6b6b',
      right: '#4ecdc4',
      both: '#ffd700',
    },
  },

  // Slot display order for BottomBar (visual left-to-right)
  // [Back2, Back4, Center5, Front3, Front1] = slot indices [1, 3, 4, 2, 0]
  // This creates visual grouping: Left attackers | Center | Right attackers
  SLOT_DISPLAY_ORDER: [1, 3, 4, 2, 0] as readonly number[],

  // Modal configuration
  MODAL: {
    WIDTH: 320,
    PADDING: 20,
    BORDER_RADIUS: 8,
    BACKGROUND: 0x1a1a2e,
    OVERLAY_ALPHA: 0.7,
    BUTTON_HEIGHT: 32,
    BUTTON_WIDTH: 100,
    BUTTON_SPACING: 12,
  },
} as const;

// Panel identifiers
export enum PanelType {
  TANK_STATS = 'tank_stats',
  INVENTORY = 'inventory',
  SHOP = 'shop',
  SETTINGS = 'settings',
  DEBUG = 'debug',
}

// Sidebar button configuration
export const SIDEBAR_BUTTONS = [
  { type: PanelType.TANK_STATS, label: 'Tank', shortcut: 'TAB' },
  { type: PanelType.INVENTORY, label: 'Inventory', shortcut: 'I' },
  { type: PanelType.SHOP, label: 'Shop', shortcut: 'P' },
  { type: PanelType.SETTINGS, label: 'Settings', shortcut: 'ESC' },
] as const;
