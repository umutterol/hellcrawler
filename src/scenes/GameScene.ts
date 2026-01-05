import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Tank } from '../entities/Tank';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { LootSystem } from '../systems/LootSystem';
import { GameUI } from '../ui/GameUI';
import { TopBar } from '../ui/TopBar';
import { BottomBar } from '../ui/BottomBar';
import { Sidebar } from '../ui/Sidebar';
import { TankStatsPanel, InventoryPanel, ShopPanel, SettingsPanel, DebugPanel } from '../ui/panels';
import { ParallaxBackground } from '../ui/ParallaxBackground';
import { ModuleManager } from '../modules/ModuleManager';
import { ModuleItem } from '../modules/ModuleItem';
import { ModuleType } from '../types/ModuleTypes';
import { getGameState } from '../state/GameState';
import { getSaveManager, SaveManager } from '../managers/SaveManager';
import { InputManager } from '../managers/InputManager';
import { getPanelManager, PanelManager } from '../managers/PanelManager';
import { ClickThroughManager } from '../managers/ClickThroughManager';
import { getGoreManager } from '../effects/gore/GoreManager';

/**
 * Main Game Scene - Core gameplay loop
 *
 * Phase 3 Implementation:
 * - Tank entity at screen center (all damage from modules)
 * - Enemy spawning with wave system
 * - Combat system with damage and collisions
 * - Object pooling for enemies and projectiles
 * - UI overlay for game state
 */
export class GameScene extends Phaser.Scene {

  // Entity groups
  private enemies!: Phaser.GameObjects.Group;
  private projectiles!: Phaser.GameObjects.Group;

  // Game objects
  private tank!: Tank;

  // Systems
  private combatSystem!: CombatSystem;
  private waveSystem!: WaveSystem;
  private lootSystem!: LootSystem;

  // Module system
  private moduleManager!: ModuleManager;

  // UI
  private topBar!: TopBar;
  private bottomBar!: BottomBar;
  private gameUI!: GameUI;
  private sidebar!: Sidebar;
  private fpsText: Phaser.GameObjects.Text | null = null;

  // Panel system
  private panelManager!: PanelManager;
  private tankStatsPanel!: TankStatsPanel;
  private inventoryPanel!: InventoryPanel;
  private shopPanel!: ShopPanel;
  private settingsPanel!: SettingsPanel;
  private debugPanel: DebugPanel | null = null;

  // Save system
  private saveManager!: SaveManager;

  // Input handling
  private inputManager!: InputManager;

  // Background
  private parallaxBackground!: ParallaxBackground;

  // Desktop Mode (Electron)
  // Note: Initialized for Electron window click-through behavior
  private _clickThroughManager: ClickThroughManager | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize managers
    this.initializeManagers();

    // Create visual layers
    this.createBackground();

    // Create entity groups
    this.createEntityGroups();

    // Create pools
    this.createPools();

    // Create game objects
    this.createTank();

    // Initialize systems
    this.initializeSystems();

    // Create UI
    this.createUI();

    // Start first wave
    this.startGame();

    // Initialize click-through manager for Electron Desktop Mode
    this._clickThroughManager = new ClickThroughManager(this);

    if (import.meta.env.DEV) {
      console.log('Hellcrawler GameScene initialized (Phase 3)');
      console.log(`Resolution: ${GAME_CONFIG.WIDTH}x${GAME_CONFIG.HEIGHT}`);
    }
  }

  private initializeManagers(): void {
    // Managers are singletons - no initialization needed here
    // EventManager and GameState are accessed via their getInstance() methods

    // Initialize save manager and try to load saved game
    this.saveManager = getSaveManager();
    if (this.saveManager.hasSave()) {
      const loaded = this.saveManager.load();
      if (loaded && import.meta.env.DEV) {
        const info = this.saveManager.getSaveInfo();
        console.log('[GameScene] Loaded save:', info);
      }
    }
  }

  private createBackground(): void {
    // Create parallax background with multiple scrolling layers
    this.parallaxBackground = new ParallaxBackground(this);

    // Set base depth so game entities appear on top
    this.parallaxBackground.setBaseDepth(-100);

    // Add ground overlay on top of parallax layers
    this.createGround();
  }

  private createGround(): void {
    // Ground surface (on top of parallax background)
    // Desktop Heroes style - shorter ground area
    const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;

    const ground = this.add.graphics();
    ground.setDepth(10); // Above parallax, below entities

    // Ground fill
    ground.fillStyle(0x2d2d44, 1);
    ground.fillRect(0, groundY, GAME_CONFIG.WIDTH, GAME_CONFIG.GROUND_HEIGHT);

    // Ground line (surface highlight)
    ground.lineStyle(3, 0x444466);
    ground.lineBetween(0, groundY, GAME_CONFIG.WIDTH, groundY);
  }

  private createEntityGroups(): void {
    // Create physics groups for collision detection
    // runChildUpdate runs preUpdate on children automatically
    this.enemies = this.physics.add.group({
      runChildUpdate: true,
    });

    this.projectiles = this.physics.add.group({
      runChildUpdate: true,
    });
  }

  private createPools(): void {
    // Pre-create enemies in the pool manually
    // Enemy constructor already adds to scene and physics, so don't add again
    for (let i = 0; i < GAME_CONFIG.POOL_SIZES.ENEMIES_PER_TYPE; i++) {
      const enemy = new Enemy(this);
      this.enemies.add(enemy); // Don't add to scene again, just track in group
      enemy.deactivate();
    }

    // Pre-create projectiles in the pool
    for (let i = 0; i < GAME_CONFIG.POOL_SIZES.PROJECTILES; i++) {
      const projectile = new Projectile(this);
      this.projectiles.add(projectile);
      projectile.deactivate();
    }

    if (import.meta.env.DEV) {
      console.log(`[GameScene] Created pools: ${this.enemies.getChildren().length} enemies, ${this.projectiles.getChildren().length} projectiles`);
    }
  }

  private createTank(): void {
    // Position tank at screen center for bidirectional combat
    const tankX = GAME_CONFIG.TANK_X;
    const tankY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT; // Ground level

    this.tank = new Tank(this, tankX, tankY);
  }

  private initializeSystems(): void {
    const gameState = getGameState();

    // Module manager handles equipped modules
    this.moduleManager = new ModuleManager(this, gameState);
    this.moduleManager.setTankPosition(this.tank.x, this.tank.y);
    this.moduleManager.setProjectileGroup(this.projectiles);
    this.moduleManager.setTankContainer(this.tank); // Attach module sprites to tank

    // Combat system handles projectile-enemy and enemy-tank collisions
    this.combatSystem = new CombatSystem(
      this,
      this.tank,
      this.enemies,
      this.projectiles
    );

    // Wave system handles enemy spawning
    this.waveSystem = new WaveSystem(this, this.enemies);

    // Loot system handles module drops
    this.lootSystem = new LootSystem(this);

    // Gore system handles death effects (gibs, blood, splatters)
    getGoreManager().init(this);

    // Equip starting module (1× Uncommon Machine Gun per GDD)
    this.equipStartingModule();

    // Initialize input manager for skill hotkeys
    this.inputManager = new InputManager();
    this.inputManager.setScene(this);
  }

  /**
   * Equip starting modules - 2× Basic Machine Guns (front + back, no stats)
   * Center tank design: Player begins with Machine Gun in both directions
   * - Slot 0 (front): attacks RIGHT
   * - Slot 1 (back): attacks LEFT
   */
  private equipStartingModule(): void {
    // Check if player already has modules equipped (loaded save)
    const slot0 = this.moduleManager.getSlot(0);
    const slot1 = this.moduleManager.getSlot(1);
    if (slot0 && slot0.hasModule() && slot1 && slot1.hasModule()) {
      if (import.meta.env.DEV) {
        console.log('[GameScene] Starting modules already equipped (loaded save)');
      }
      return;
    }

    // Generate basic Machine Guns with no stats for bidirectional combat
    const frontModule = ModuleItem.generateBasic(ModuleType.MachineGun);
    const backModule = ModuleItem.generateBasic(ModuleType.MachineGun);

    // Equip to slot 0 (front - attacks RIGHT) if empty
    if (slot0 && !slot0.hasModule()) {
      this.moduleManager.equipModule(0, frontModule);
      if (import.meta.env.DEV) {
        console.log('[GameScene] Equipped front module (slot 0):', frontModule.getTypeName());
      }
    }

    // Equip to slot 1 (back - attacks LEFT) if empty
    if (slot1 && !slot1.hasModule()) {
      this.moduleManager.equipModule(1, backModule);
      if (import.meta.env.DEV) {
        console.log('[GameScene] Equipped back module (slot 1):', backModule.getTypeName());
      }
    }
  }

  private createUI(): void {
    // Top bar with gold, XP, zone info
    this.topBar = new TopBar(this);

    // Bottom bar with HP, module slots, wave progress
    this.bottomBar = new BottomBar(this, this.moduleManager);

    // Core HUD elements (deprecated - most moved to TopBar/BottomBar)
    this.gameUI = new GameUI(this);

    // Initialize panel system
    this.initializePanelSystem();

    // FPS counter (dev only)
    if (import.meta.env.DEV) {
      this.fpsText = this.add.text(GAME_CONFIG.WIDTH - 80, GAME_CONFIG.HEIGHT - 130, 'FPS: --', {
        fontSize: '16px',
        color: '#00ff00',
      });
      this.fpsText.setDepth(1000);
    }
  }

  /**
   * Initialize the sliding panel system
   */
  private initializePanelSystem(): void {
    // Get/create panel manager
    this.panelManager = getPanelManager();
    this.panelManager.setScene(this);

    // Create sidebar (left side navigation)
    this.sidebar = new Sidebar(this);

    // Create all panels
    this.tankStatsPanel = new TankStatsPanel(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.shopPanel = new ShopPanel(this);
    this.settingsPanel = new SettingsPanel(this);

    // Register panels with manager
    this.panelManager.registerPanel(this.tankStatsPanel);
    this.panelManager.registerPanel(this.inventoryPanel);
    this.panelManager.registerPanel(this.shopPanel);
    this.panelManager.registerPanel(this.settingsPanel);

    // Create and register debug panel (DEV only)
    if (import.meta.env.DEV) {
      this.debugPanel = new DebugPanel(this, this.waveSystem, this.enemies);
      this.panelManager.registerPanel(this.debugPanel);
    }

    // Enable panel manager integration in InputManager
    this.inputManager.enablePanelManager();

    if (import.meta.env.DEV) {
      console.log(`[GameScene] Panel system initialized with ${this.debugPanel ? 5 : 4} panels`);
    }
  }

  private startGame(): void {
    // Reset game state for new game
    // this.gameState.reset(); // Uncomment for fresh start

    // Start first wave with slight delay
    this.time.delayedCall(1000, () => {
      this.waveSystem.startWave(1);
    });
  }

  update(time: number, delta: number): void {
    // Update parallax background
    this.parallaxBackground.update(time, delta);

    // Update tank
    this.tank.update(time, delta);

    // Update combat system (handles collisions)
    this.combatSystem.update(time, delta);

    // Update wave system (handles enemy spawning)
    this.waveSystem.update(time, delta);

    // Get active enemies for module targeting
    const activeEnemies = this.enemies.getChildren().filter(
      (child) => (child as Enemy).active && (child as Enemy).isAlive()
    ) as Enemy[];

    // Update module manager (fires modules, updates cooldowns)
    this.moduleManager.update(time, delta, activeEnemies);

    // Update input manager (checks for skill key presses)
    this.inputManager.update(this.moduleManager, activeEnemies);

    // Update loot system
    this.lootSystem.update(time, delta);

    // Update UI
    this.bottomBar.update(time, delta);
    this.bottomBar.updateEnemyCount(this.waveSystem.getEnemiesRemaining());

    // Update FPS counter
    this.updateDebugInfo(delta);
  }

  private updateDebugInfo(delta: number): void {
    if (this.fpsText && import.meta.env.DEV) {
      const fps = Math.round(1000 / delta);
      this.fpsText.setText(`FPS: ${fps}`);

      if (fps < 55) {
        this.fpsText.setColor('#ff0000');
      } else {
        this.fpsText.setColor('#00ff00');
      }
    }
  }

  /**
   * Scene shutdown - cleanup
   */
  shutdown(): void {
    // Cleanup background
    this.parallaxBackground.destroy();

    // Cleanup systems
    this.combatSystem.destroy();
    this.waveSystem.destroy();
    this.lootSystem.destroy();
    this.moduleManager.destroy();
    this.inputManager.destroy();
    getGoreManager().destroy();

    // Cleanup Desktop Mode (Electron)
    if (this._clickThroughManager) {
      this._clickThroughManager.destroy();
      this._clickThroughManager = null;
    }

    // Cleanup UI
    this.topBar.destroy();
    this.bottomBar.destroy();
    this.gameUI.destroy();
    this.sidebar.destroy();

    // Cleanup panels
    this.tankStatsPanel.destroy();
    this.inventoryPanel.destroy();
    this.shopPanel.destroy();
    this.settingsPanel.destroy();

    // Cleanup panel manager
    PanelManager.resetInstance();

    // Cleanup entities
    this.tank.destroy();
  }
}
