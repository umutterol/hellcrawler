import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { getSettingsManager } from '../managers/SettingsManager';
import { getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';

/**
 * Layer group identifiers for visibility toggles
 * Maps to settings: showSkyLayer, showMountainsLayer, showFarBuildingsLayer, showForegroundLayer
 */
export enum LayerGroup {
  Sky = 'sky', // bg-sky + bg-clouds
  Mountains = 'mountains', // bg-mountains + bg-mountains-lights
  FarBuildings = 'farBuildings', // bg-far-buildings
  Foreground = 'foreground', // bg-forest + bg-town
}

/**
 * Mapping from layer keys to their group
 */
const LAYER_GROUP_MAP: Record<string, LayerGroup> = {
  'bg-sky': LayerGroup.Sky,
  'bg-clouds': LayerGroup.Sky,
  'bg-mountains': LayerGroup.Mountains,
  'bg-mountains-lights': LayerGroup.Mountains,
  'bg-far-buildings': LayerGroup.FarBuildings,
  'bg-forest': LayerGroup.Foreground,
  'bg-town': LayerGroup.Foreground,
};

/**
 * Parallax layer configuration
 */
interface ParallaxLayer {
  key: string;
  speed: number; // Scroll speed multiplier (0 = static, 1 = fast)
  yOffset: number; // Y offset from bottom
  autoScroll: boolean; // Whether this layer scrolls automatically
  autoScrollSpeed: number; // Speed of auto-scroll (pixels per second)
  tileSprites: Phaser.GameObjects.TileSprite[];
  depth: number;
  group: LayerGroup;
}

/**
 * ParallaxBackground - Multi-layer scrolling background system
 *
 * Creates a layered background with parallax scrolling effect.
 * Back layers move slower than front layers, creating depth perception.
 *
 * For Hellcrawler, this creates an atmospheric city invasion backdrop
 * while the tank remains stationary and enemies approach.
 */
export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private baseScrollSpeed: number = 20; // Base pixels per second
  private settingsHandler: ((data: { key: string }) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createLayers();
    this.applyInitialVisibility();
    this.setupSettingsListener();
  }

  /**
   * Apply initial visibility based on saved settings
   */
  private applyInitialVisibility(): void {
    const settings = getSettingsManager();

    this.setLayerGroupVisibility(LayerGroup.Sky, settings.showSkyLayer);
    this.setLayerGroupVisibility(LayerGroup.Mountains, settings.showMountainsLayer);
    this.setLayerGroupVisibility(LayerGroup.FarBuildings, settings.showFarBuildingsLayer);
    this.setLayerGroupVisibility(LayerGroup.Foreground, settings.showForegroundLayer);
  }

  /**
   * Listen for settings changes to update layer visibility
   */
  private setupSettingsListener(): void {
    this.settingsHandler = (data: { key: string }) => {
      const settings = getSettingsManager();

      switch (data.key) {
        case 'showSkyLayer':
          this.setLayerGroupVisibility(LayerGroup.Sky, settings.showSkyLayer);
          break;
        case 'showMountainsLayer':
          this.setLayerGroupVisibility(LayerGroup.Mountains, settings.showMountainsLayer);
          break;
        case 'showFarBuildingsLayer':
          this.setLayerGroupVisibility(LayerGroup.FarBuildings, settings.showFarBuildingsLayer);
          break;
        case 'showForegroundLayer':
          this.setLayerGroupVisibility(LayerGroup.Foreground, settings.showForegroundLayer);
          break;
        case 'all':
          // Full settings reset - reapply all
          this.applyInitialVisibility();
          break;
      }
    };

    getEventManager().on(GameEvents.SETTINGS_CHANGED, this.settingsHandler);
  }

  /**
   * Create all parallax layers from back to front
   */
  private createLayers(): void {
    // Layer order (back to front) with speed multipliers
    // Lower speed = slower movement = appears farther away
    const layerConfigs = [
      {
        key: 'bg-sky',
        speed: 0,
        yOffset: 0,
        autoScroll: false,
        autoScrollSpeed: 0,
        depth: 0,
      },
      {
        key: 'bg-clouds',
        speed: 0.05,
        yOffset: 0,
        autoScroll: true,
        autoScrollSpeed: 8, // Slow cloud drift
        depth: 1,
      },
      {
        key: 'bg-mountains',
        speed: 0.1,
        yOffset: 0,
        autoScroll: false,
        autoScrollSpeed: 0,
        depth: 2,
      },
      {
        key: 'bg-mountains-lights',
        speed: 0.1,
        yOffset: 0,
        autoScroll: false,
        autoScrollSpeed: 0,
        depth: 3,
      },
      {
        key: 'bg-far-buildings',
        speed: 0.2,
        yOffset: 0,
        autoScroll: false,
        autoScrollSpeed: 0,
        depth: 4,
      },
      {
        key: 'bg-forest',
        speed: 0.4,
        yOffset: 0,
        autoScroll: false,
        autoScrollSpeed: 0,
        depth: 5,
      },
      {
        key: 'bg-town',
        speed: 0.6,
        yOffset: 0,
        autoScroll: false,
        autoScrollSpeed: 0,
        depth: 6,
      },
    ];

    for (const config of layerConfigs) {
      this.createLayer(config);
    }
  }

  /**
   * Create a single parallax layer
   * Uses TileSprite for seamless horizontal scrolling
   */
  private createLayer(config: {
    key: string;
    speed: number;
    yOffset: number;
    autoScroll: boolean;
    autoScrollSpeed: number;
    depth: number;
  }): void {
    // Check if texture exists
    if (!this.scene.textures.exists(config.key)) {
      console.warn(`[ParallaxBackground] Texture not found: ${config.key}`);
      return;
    }

    const texture = this.scene.textures.get(config.key);
    const frame = texture.get();
    const textureHeight = frame.height;

    // Calculate scale to fit game height while maintaining aspect ratio
    // We want the layer to cover the full game height
    const scaleY = GAME_CONFIG.HEIGHT / textureHeight;

    // Create tile sprite that covers the full game width
    // TileSprite allows seamless horizontal tiling
    const tileSprite = this.scene.add.tileSprite(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 + config.yOffset,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT,
      config.key
    );

    tileSprite.setDepth(config.depth);

    // Scale the tile to fit properly
    // We need to set the tile scale, not the sprite scale
    tileSprite.setTileScale(scaleY, scaleY);

    const layer: ParallaxLayer = {
      key: config.key,
      speed: config.speed,
      yOffset: config.yOffset,
      autoScroll: config.autoScroll,
      autoScrollSpeed: config.autoScrollSpeed,
      tileSprites: [tileSprite],
      depth: config.depth,
      group: LAYER_GROUP_MAP[config.key] || LayerGroup.Foreground,
    };

    this.layers.push(layer);
  }

  /**
   * Set visibility for an entire layer group
   * Used for Desktop Mode layer toggles
   */
  setLayerGroupVisibility(group: LayerGroup, visible: boolean): void {
    for (const layer of this.layers) {
      if (layer.group === group) {
        for (const sprite of layer.tileSprites) {
          sprite.setVisible(visible);
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log(`[ParallaxBackground] Layer group ${group} visibility: ${visible}`);
    }
  }

  /**
   * Get visibility state of a layer group
   */
  getLayerGroupVisibility(group: LayerGroup): boolean {
    const layer = this.layers.find((l) => l.group === group);
    const firstSprite = layer?.tileSprites[0];
    if (firstSprite) {
      return firstSprite.visible;
    }
    return true;
  }

  /**
   * Update parallax scrolling
   * Call this from scene's update method
   */
  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    for (const layer of this.layers) {
      for (const sprite of layer.tileSprites) {
        // Auto-scroll (for clouds, etc.)
        if (layer.autoScroll) {
          sprite.tilePositionX += layer.autoScrollSpeed * deltaSeconds;
        }

        // Parallax scroll based on speed
        // This creates constant movement for the parallax effect
        sprite.tilePositionX += this.baseScrollSpeed * layer.speed * deltaSeconds;
      }
    }
  }

  /**
   * Set the base scroll speed for all layers
   * Higher values = faster parallax movement
   */
  setBaseScrollSpeed(speed: number): void {
    this.baseScrollSpeed = speed;
  }

  /**
   * Get a specific layer by key
   */
  getLayer(key: string): ParallaxLayer | undefined {
    return this.layers.find((layer) => layer.key === key);
  }

  /**
   * Set depth for all layers (useful for z-ordering with game objects)
   * @param baseDepth The starting depth for the back-most layer
   */
  setBaseDepth(baseDepth: number): void {
    this.layers.forEach((layer, i) => {
      layer.depth = baseDepth + i;
      for (const sprite of layer.tileSprites) {
        sprite.setDepth(layer.depth);
      }
    });
  }

  /**
   * Cleanup - remove event listeners and destroy sprites
   */
  destroy(): void {
    // Clean up event listener
    if (this.settingsHandler) {
      getEventManager().off(GameEvents.SETTINGS_CHANGED, this.settingsHandler);
      this.settingsHandler = null;
    }

    // Destroy all sprites
    for (const layer of this.layers) {
      for (const sprite of layer.tileSprites) {
        sprite.destroy();
      }
    }
    this.layers = [];
  }
}
