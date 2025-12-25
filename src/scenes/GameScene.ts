import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Tank } from '../entities/Tank';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { LootSystem } from '../systems/LootSystem';
import { GameUI } from '../ui/GameUI';
import { ModuleSlotUI } from '../ui/ModuleSlotUI';
import { ModuleManager } from '../modules/ModuleManager';
import { ModuleItem } from '../modules/ModuleItem';
import { ModuleType } from '../types/ModuleTypes';
import { Rarity } from '../types/GameTypes';
import { getGameState } from '../state/GameState';

/**
 * Main Game Scene - Core gameplay loop
 *
 * Phase 3 Implementation:
 * - Tank entity with auto-firing cannon
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
  private gameUI!: GameUI;
  private moduleSlotUI!: ModuleSlotUI;
  private fpsText: Phaser.GameObjects.Text | null = null;

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

    if (import.meta.env.DEV) {
      console.log('Hellcrawler GameScene initialized (Phase 3)');
      console.log(`Resolution: ${GAME_CONFIG.WIDTH}x${GAME_CONFIG.HEIGHT}`);
    }
  }

  private initializeManagers(): void {
    // Managers are singletons - no initialization needed here
    // EventManager and GameState are accessed via their getInstance() methods
  }

  private createBackground(): void {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Ground
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRect(0, GAME_CONFIG.HEIGHT - 100, GAME_CONFIG.WIDTH, 100);

    // Ground line
    bg.lineStyle(3, 0x444466);
    bg.lineBetween(
      0,
      GAME_CONFIG.HEIGHT - 100,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT - 100
    );

    // Add some atmospheric details
    this.createBackgroundDetails();
  }

  private createBackgroundDetails(): void {
    // Distant mountains/structures silhouette
    const details = this.add.graphics();
    details.fillStyle(0x0d0d1a, 0.5);

    // Simple mountain shapes
    details.beginPath();
    details.moveTo(0, GAME_CONFIG.HEIGHT - 100);
    details.lineTo(200, GAME_CONFIG.HEIGHT - 250);
    details.lineTo(400, GAME_CONFIG.HEIGHT - 150);
    details.lineTo(600, GAME_CONFIG.HEIGHT - 300);
    details.lineTo(900, GAME_CONFIG.HEIGHT - 180);
    details.lineTo(1100, GAME_CONFIG.HEIGHT - 350);
    details.lineTo(1400, GAME_CONFIG.HEIGHT - 200);
    details.lineTo(1700, GAME_CONFIG.HEIGHT - 280);
    details.lineTo(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT - 100);
    details.lineTo(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT - 100);
    details.closePath();
    details.fill();

    // Add some stars
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_CONFIG.WIDTH);
      const y = Phaser.Math.Between(0, GAME_CONFIG.HEIGHT - 400);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.8);

      details.fillStyle(0xffffff, alpha);
      details.fillCircle(x, y, size);
    }
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
    const tankX = 200;
    const tankY = GAME_CONFIG.HEIGHT - 100;

    this.tank = new Tank(this, tankX, tankY);
  }

  private initializeSystems(): void {
    const gameState = getGameState();

    // Module manager handles equipped modules
    this.moduleManager = new ModuleManager(this, gameState);
    this.moduleManager.setTankPosition(this.tank.x, this.tank.y);

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

    // Equip starting module (1× Uncommon Machine Gun per GDD)
    this.equipStartingModule();
  }

  /**
   * Equip the starting module - 1× Uncommon Machine Gun
   * Per GDD: "Player begins with: 1× Uncommon Machine Gun (random stat roll)"
   */
  private equipStartingModule(): void {
    // Check if player already has modules equipped (loaded save)
    const slot0 = this.moduleManager.getSlot(0);
    if (slot0 && slot0.hasModule()) {
      if (import.meta.env.DEV) {
        console.log('[GameScene] Starting module already equipped (loaded save)');
      }
      return;
    }

    // Generate starting Uncommon Machine Gun
    const startingModule = ModuleItem.generate(ModuleType.MachineGun, Rarity.Uncommon);

    // Equip to slot 0
    this.moduleManager.equipModule(0, startingModule);

    if (import.meta.env.DEV) {
      console.log('[GameScene] Equipped starting module:', startingModule.getTypeName());
      console.log('[GameScene] Stats:', startingModule.getStats());
    }
  }

  private createUI(): void {
    this.gameUI = new GameUI(this);
    this.moduleSlotUI = new ModuleSlotUI(this, this.moduleManager);

    // FPS counter (dev only)
    if (import.meta.env.DEV) {
      this.fpsText = this.add.text(GAME_CONFIG.WIDTH - 80, GAME_CONFIG.HEIGHT - 130, 'FPS: --', {
        fontSize: '16px',
        color: '#00ff00',
      });
      this.fpsText.setDepth(1000);
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
    // Update tank
    this.tank.update(time, delta);

    // Update combat system (handles cannon firing)
    this.combatSystem.update(time, delta);

    // Update wave system (handles enemy spawning)
    this.waveSystem.update(time, delta);

    // Get active enemies for module targeting
    const activeEnemies = this.enemies.getChildren().filter(
      (child) => (child as Enemy).active && (child as Enemy).isAlive()
    ) as Enemy[];

    // Update module manager (fires modules, updates cooldowns)
    this.moduleManager.update(time, delta, activeEnemies);

    // Update loot system
    this.lootSystem.update(time, delta);

    // Update UI
    this.gameUI.update(time, delta);
    this.moduleSlotUI.update(time, delta);
    this.gameUI.updateEnemyCount(this.waveSystem.getEnemiesRemaining());

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
    this.combatSystem.destroy();
    this.waveSystem.destroy();
    this.lootSystem.destroy();
    this.moduleManager.destroy();
    this.gameUI.destroy();
    this.moduleSlotUI.destroy();
    this.tank.destroy();
  }
}
