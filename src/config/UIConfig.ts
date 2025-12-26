/**
 * UI Configuration Constants
 * Centralized constants for the sliding panel UI system
 * Based on UISpec.md specifications
 */

export const UI_CONFIG = {
  // Screen dimensions (reference)
  WIDTH: 1920,
  HEIGHT: 1080,

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

  // Sidebar
  SIDEBAR: {
    WIDTH: 56,
    ICON_SIZE: 40,
    PADDING: 8,
    TOP_OFFSET: 48, // Below top bar
    BOTTOM_OFFSET: 120, // Above bottom bar
  },

  // Sliding Panel
  PANEL: {
    WIDTH: 400,
    OPEN_DURATION: 300,
    CLOSE_DURATION: 250,
    EASE_OPEN: 'Cubic.easeOut',
    EASE_CLOSE: 'Cubic.easeIn',
  },

  // Top Bar
  TOP_BAR: {
    HEIGHT: 48,
  },

  // Bottom Bar
  BOTTOM_BAR: {
    HEIGHT: 120,
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

  // Typography
  FONTS: {
    HEADER: {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#f5f5f5',
    },
    SECTION_HEADER: {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#f5f5f5',
    },
    BODY: {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#f5f5f5',
    },
    SMALL: {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#a0a0a0',
    },
  },
} as const;

// Panel identifiers
export enum PanelType {
  TANK_STATS = 'tank_stats',
  INVENTORY = 'inventory',
  SHOP = 'shop',
  SETTINGS = 'settings',
}

// Sidebar button configuration
export const SIDEBAR_BUTTONS = [
  { type: PanelType.TANK_STATS, label: 'Tank', shortcut: 'TAB' },
  { type: PanelType.INVENTORY, label: 'Inventory', shortcut: 'I' },
  { type: PanelType.SHOP, label: 'Shop', shortcut: 'P' },
  { type: PanelType.SETTINGS, label: 'Settings', shortcut: 'ESC' },
] as const;
