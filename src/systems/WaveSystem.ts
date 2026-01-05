import Phaser from 'phaser';
import { Enemy, getScaledEnemyConfig } from '../entities/Enemy';
import { EnemyType } from '../types/EnemyTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameState, getGameState } from '../state/GameState';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Wave composition definition
 */
interface WaveComposition {
  fodder: { type: EnemyType; count: number }[];
  elites: { type: EnemyType; count: number }[];
  superElite?: EnemyType;
  boss?: EnemyType;
}

/**
 * Spawn side for bidirectional combat
 */
type SpawnSide = 'left' | 'right';

/**
 * Spawn event for delayed enemy spawning
 */
interface SpawnEvent {
  type: EnemyType;
  delay: number;
  spawned: boolean;
  side: SpawnSide; // Which side of screen to spawn from
}

/**
 * WaveSystem - Manages wave progression and enemy spawning
 *
 * Responsibilities:
 * - Wave composition management
 * - Enemy spawning with timing
 * - Wave completion detection
 * - Progression events
 */
export class WaveSystem {
  private scene: Phaser.Scene;
  private enemies: Phaser.GameObjects.Group;
  private eventManager: EventManager;
  private gameState: GameState;

  // State
  private waveInProgress: boolean = false;
  private currentWave: number = 1;
  private waveStartTime: number = 0;
  private spawnQueue: SpawnEvent[] = [];
  private enemiesSpawned: number = 0;
  private enemiesKilled: number = 0;
  private totalEnemiesInWave: number = 0;

  // Spawn configuration - bidirectional (enemies from both sides)
  private spawnY: number;
  private spawnXRight: number; // Right side spawn (off-screen right)
  private spawnXLeft: number;  // Left side spawn (off-screen left)

  // Wave pause
  private isWavePaused: boolean = false;
  private wavePauseTimer: number = 0;

  // Fodder types for random selection
  private readonly fodderTypes: EnemyType[] = [
    EnemyType.Imp,
    EnemyType.Hellhound,
    EnemyType.PossessedSoldier,
    EnemyType.FireSkull,
  ];

  private readonly eliteTypes: EnemyType[] = [
    EnemyType.Demon,
    EnemyType.Necromancer,
    EnemyType.ShadowFiend,
    EnemyType.InfernalWarrior,
  ];

  constructor(
    scene: Phaser.Scene,
    enemies: Phaser.GameObjects.Group
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.eventManager = getEventManager();
    this.gameState = getGameState();

    // Spawn positions - bidirectional (tank is centered, enemies from both sides)
    this.spawnY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
    this.spawnXRight = GAME_CONFIG.WIDTH + 50;  // Off-screen right
    this.spawnXLeft = -50;                       // Off-screen left

    // Subscribe to events
    this.eventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
    this.eventManager.on(GameEvents.ZONE_CHANGED, this.onZoneChanged, this);
  }

  /**
   * Handle zone change - reset waves and start fresh
   */
  private onZoneChanged(payload: { newAct: number; newZone: number }): void {
    if (import.meta.env.DEV) {
      console.log(`[WaveSystem] Zone changed to Act ${payload.newAct}, Zone ${payload.newZone} - resetting waves`);
    }

    // Kill all active enemies
    this.clearAllEnemies();

    // Reset wave state
    this.waveInProgress = false;
    this.isWavePaused = false;
    this.wavePauseTimer = 0;
    this.currentWave = 0;
    this.spawnQueue = [];
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.totalEnemiesInWave = 0;

    // Start wave 1 after a short delay
    this.scene.time.delayedCall(500, () => {
      this.startWave(1);
    });
  }

  /**
   * Clear all active enemies from the field
   */
  private clearAllEnemies(): void {
    const enemies = this.enemies.getChildren() as Enemy[];
    let cleared = 0;

    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.deactivate();
        cleared++;
      }
    }

    if (import.meta.env.DEV && cleared > 0) {
      console.log(`[WaveSystem] Cleared ${cleared} enemies for zone change`);
    }
  }

  /**
   * Start a new wave
   */
  public startWave(waveNumber: number): void {
    if (this.waveInProgress) {
      console.warn('[WaveSystem] Wave already in progress');
      return;
    }

    this.currentWave = waveNumber;
    this.waveInProgress = true;
    this.waveStartTime = this.scene.time.now;
    this.spawnQueue = [];
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;

    // Get wave composition
    const composition = this.getWaveComposition(waveNumber);
    this.buildSpawnQueue(composition);

    // Determine if this is a boss wave
    const isBossWave = waveNumber === GAME_CONFIG.WAVES_PER_ZONE;

    // Emit wave start event
    this.eventManager.emit(GameEvents.WAVE_STARTED, {
      waveNumber,
      zoneNumber: this.gameState.getCurrentZone(),
      actNumber: this.gameState.getCurrentAct(),
      enemyCount: this.totalEnemiesInWave,
      isBossWave,
    });

    if (import.meta.env.DEV) {
      console.log(`[WaveSystem] Started wave ${waveNumber} with ${this.totalEnemiesInWave} enemies`);
    }
  }

  /**
   * Get wave composition based on wave number
   * GDD Wave Composition:
   * Wave 1: 5 Fodder
   * Wave 2: 8 Fodder
   * Wave 3: 6 Fodder + 1 Elite
   * Wave 4: 10 Fodder + 1 Elite
   * Wave 5: 8 Fodder + 2 Elite
   * Wave 6: 12 Fodder + 2 Elite
   * Wave 7: Super Elite OR Boss
   */
  private getWaveComposition(waveNumber: number): WaveComposition {
    const zone = this.gameState.getCurrentZone();

    switch (waveNumber) {
      case 1:
        return {
          fodder: [{ type: this.randomFodder(), count: 5 }],
          elites: [],
        };
      case 2:
        return {
          fodder: [{ type: this.randomFodder(), count: 8 }],
          elites: [],
        };
      case 3:
        return {
          fodder: [{ type: this.randomFodder(), count: 6 }],
          elites: [{ type: this.randomElite(), count: 1 }],
        };
      case 4:
        return {
          fodder: [{ type: this.randomFodder(), count: 10 }],
          elites: [{ type: this.randomElite(), count: 1 }],
        };
      case 5:
        return {
          fodder: [{ type: this.randomFodder(), count: 8 }],
          elites: [{ type: this.randomElite(), count: 2 }],
        };
      case 6:
        return {
          fodder: [
            { type: this.randomFodder(), count: 6 },
            { type: this.randomFodder(), count: 6 },
          ],
          elites: [{ type: this.randomElite(), count: 2 }],
        };
      case 7:
        // Boss wave - zone 1 = super elite, zone 2 = boss (Corrupted Sentinel per GDD)
        if (zone === 1) {
          return {
            fodder: [],
            elites: [],
            superElite: EnemyType.ArchDemon,
          };
        } else {
          return {
            fodder: [],
            elites: [],
            boss: EnemyType.CorruptedSentinel, // Act 1 Boss per GDD
          };
        }
      default:
        return {
          fodder: [{ type: this.randomFodder(), count: 5 }],
          elites: [],
        };
    }
  }

  private randomFodder(): EnemyType {
    const index = Math.floor(Math.random() * this.fodderTypes.length);
    return this.fodderTypes[index] ?? EnemyType.Imp;
  }

  private randomElite(): EnemyType {
    const index = Math.floor(Math.random() * this.eliteTypes.length);
    return this.eliteTypes[index] ?? EnemyType.Demon;
  }

  /**
   * Get alternating spawn side (50/50 distribution)
   * Uses a simple counter to alternate left/right
   */
  private spawnSideCounter: number = 0;

  private getNextSpawnSide(): SpawnSide {
    this.spawnSideCounter++;
    return this.spawnSideCounter % 2 === 0 ? 'left' : 'right';
  }

  /**
   * Build the spawn queue from wave composition
   * Distributes enemies 50/50 between left and right sides
   */
  private buildSpawnQueue(composition: WaveComposition): void {
    let delay = 0;
    const spawnInterval = 500; // ms between spawns

    // Reset spawn side counter for each wave
    this.spawnSideCounter = Phaser.Math.Between(0, 1); // Random start side

    // Add fodder enemies - alternating sides
    for (const group of composition.fodder) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          delay: delay,
          spawned: false,
          side: this.getNextSpawnSide(),
        });
        delay += spawnInterval;
      }
    }

    // Add elite enemies (spawn after a pause) - alternating sides
    if (composition.elites.length > 0) {
      delay += 1000; // Extra pause before elites
      for (const group of composition.elites) {
        for (let i = 0; i < group.count; i++) {
          this.spawnQueue.push({
            type: group.type,
            delay: delay,
            spawned: false,
            side: this.getNextSpawnSide(),
          });
          delay += spawnInterval * 2; // Elites spawn slower
        }
      }
    }

    // Add super elite - random side
    if (composition.superElite) {
      delay += 1000;
      this.spawnQueue.push({
        type: composition.superElite,
        delay: delay,
        spawned: false,
        side: Math.random() > 0.5 ? 'left' : 'right',
      });
    }

    // Add boss - always spawns from the right (dramatic entrance)
    if (composition.boss) {
      delay += 1500;
      this.spawnQueue.push({
        type: composition.boss,
        delay: delay,
        spawned: false,
        side: 'right',
      });
    }

    this.totalEnemiesInWave = this.spawnQueue.length;

    if (import.meta.env.DEV) {
      const leftCount = this.spawnQueue.filter(s => s.side === 'left').length;
      const rightCount = this.spawnQueue.filter(s => s.side === 'right').length;
      console.log(`[WaveSystem] Spawn distribution: ${leftCount} left, ${rightCount} right`);
    }
  }

  /**
   * Spawn an enemy of the given type on the specified side
   */
  private spawnEnemy(type: EnemyType, side: SpawnSide): Enemy | null {
    // Check max enemies
    const activeCount = this.enemies.getChildren().filter(
      (child) => (child as Enemy).active
    ).length;

    if (activeCount >= GAME_CONFIG.MAX_ENEMIES_ON_SCREEN) {
      // Delay this spawn
      return null;
    }

    // Get an inactive enemy from the group
    const enemy = this.enemies.getFirstDead(false) as Enemy | null;
    if (!enemy) {
      console.warn('[WaveSystem] No inactive enemies available in pool');
      return null;
    }

    // Get scaled config based on current act/zone/wave
    const act = this.gameState.getCurrentAct();
    const zone = this.gameState.getCurrentZone();
    const wave = this.currentWave;
    const config = getScaledEnemyConfig(type, act, zone, wave);

    if (!config) {
      console.error(`[WaveSystem] No config found for enemy type: ${type}`);
      return null;
    }

    // Determine spawn X based on side
    const spawnX = side === 'left' ? this.spawnXLeft : this.spawnXRight;

    if (import.meta.env.DEV) {
      console.log(`[WaveSystem] Spawning ${type} from ${side} (Act ${act}, Zone ${zone}, Wave ${wave}) HP=${config.hp}`);
    }

    // Spawn at correct position for side
    // Enemy needs to know which side to move from (direction)
    enemy.activate(spawnX, this.spawnY, config, side);
    this.enemiesSpawned++;

    return enemy;
  }

  /**
   * Handle enemy death
   */
  private onEnemyDied(payload: { enemyId: string; xpAwarded: number; goldAwarded: number }): void {
    this.enemiesKilled++;

    // Award XP and gold
    this.gameState.addXP(payload.xpAwarded, 'enemy');
    this.gameState.addGold(payload.goldAwarded, 'enemy_drop');

    // Check wave completion
    if (this.enemiesKilled >= this.totalEnemiesInWave && this.waveInProgress) {
      this.completeWave();
    }
  }

  /**
   * Complete the current wave
   */
  private completeWave(): void {
    const duration = this.scene.time.now - this.waveStartTime;

    this.waveInProgress = false;
    this.isWavePaused = true;
    this.wavePauseTimer = GAME_CONFIG.WAVE_PAUSE_DURATION;

    // Update game state
    this.gameState.completeWave(
      duration,
      this.enemiesKilled,
      0, // XP tracked separately
      0  // Gold tracked separately
    );

    if (import.meta.env.DEV) {
      console.log(`[WaveSystem] Completed wave ${this.currentWave} in ${(duration / 1000).toFixed(1)}s`);
    }
  }

  /**
   * Check if wave system is ready to start next wave
   */
  public isReadyForNextWave(): boolean {
    return !this.waveInProgress && !this.isWavePaused;
  }

  /**
   * Get current wave number
   */
  public getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Get enemies remaining in current wave
   */
  public getEnemiesRemaining(): number {
    return this.totalEnemiesInWave - this.enemiesKilled;
  }

  /**
   * Check if wave is in progress
   */
  public isWaveInProgress(): boolean {
    return this.waveInProgress;
  }

  /**
   * Update loop - process spawn queue
   */
  public update(time: number, delta: number): void {
    // Handle wave pause between waves
    if (this.isWavePaused) {
      this.wavePauseTimer -= delta;
      if (this.wavePauseTimer <= 0) {
        this.isWavePaused = false;

        // Auto-start next wave if not past max waves
        const nextWave = this.currentWave + 1;
        if (nextWave <= GAME_CONFIG.WAVES_PER_ZONE) {
          this.startWave(nextWave);
        } else {
          // Zone complete - emit event
          this.eventManager.emit(GameEvents.ZONE_COMPLETED, {
            zoneNumber: this.gameState.getCurrentZone(),
            actNumber: this.gameState.getCurrentAct(),
            totalWaves: GAME_CONFIG.WAVES_PER_ZONE,
            totalDuration: 0,
            totalEnemiesKilled: 0,
            totalXpGained: 0,
            totalGoldGained: 0,
          });
        }
      }
      return;
    }

    if (!this.waveInProgress) return;

    const elapsed = time - this.waveStartTime;

    // Process spawn queue
    for (const spawn of this.spawnQueue) {
      if (!spawn.spawned && elapsed >= spawn.delay) {
        const enemy = this.spawnEnemy(spawn.type, spawn.side);
        if (enemy) {
          spawn.spawned = true;
        }
        // If spawn failed due to max enemies, don't mark as spawned
        // It will retry next frame
      }
    }
  }

  /**
   * Force start wave (for testing/debugging)
   */
  public forceStartWave(waveNumber: number): void {
    this.waveInProgress = false;
    this.isWavePaused = false;
    this.startWave(waveNumber);
  }

  /**
   * Debug: Spawn a specific enemy type immediately (bypasses wave system)
   * Only available in DEV mode
   * @param type - Enemy type to spawn
   * @param side - Optional spawn side (random if not specified)
   */
  public debugSpawnEnemy(type: EnemyType, side?: SpawnSide): Enemy | null {
    if (!import.meta.env.DEV) return null;

    // Check max enemies
    const activeCount = this.enemies.getChildren().filter(
      (child) => (child as Enemy).active
    ).length;

    if (activeCount >= GAME_CONFIG.MAX_ENEMIES_ON_SCREEN) {
      console.warn('[WaveSystem] Cannot spawn: max enemies on screen');
      return null;
    }

    // Get an inactive enemy from the group
    const enemy = this.enemies.getFirstDead(false) as Enemy | null;
    if (!enemy) {
      console.warn('[WaveSystem] No inactive enemies available in pool for debug spawn');
      return null;
    }

    // Get scaled config based on current act/zone/wave
    const act = this.gameState.getCurrentAct();
    const zone = this.gameState.getCurrentZone();
    const wave = this.currentWave;
    const config = getScaledEnemyConfig(type, act, zone, wave);

    if (!config) {
      console.error(`[WaveSystem] No config found for enemy type: ${type}`);
      return null;
    }

    // Use provided side or random
    const spawnSide: SpawnSide = side ?? (Math.random() > 0.5 ? 'left' : 'right');
    const baseX = spawnSide === 'left' ? this.spawnXLeft : this.spawnXRight;

    // Spawn with X variation so multiple debug spawns don't overlap
    const xOffset = spawnSide === 'left' ? -Phaser.Math.Between(0, 200) : Phaser.Math.Between(0, 200);
    enemy.activate(baseX + xOffset, this.spawnY, config, spawnSide);

    if (import.meta.env.DEV) {
      console.log(`[WaveSystem] Debug spawned: ${type} from ${spawnSide} (Act ${act}) HP=${config.hp}`);
    }

    return enemy;
  }

  /**
   * Debug: Kill all active enemies immediately
   * Returns the count of enemies killed
   * Only available in DEV mode
   */
  public debugKillAllEnemies(): number {
    if (!import.meta.env.DEV) return 0;

    let killed = 0;
    const enemies = this.enemies.getChildren() as Enemy[];

    for (const enemy of enemies) {
      if (enemy.active && enemy.isAlive()) {
        // Deal massive damage to kill instantly
        enemy.takeDamage(999999);
        killed++;
      }
    }

    if (import.meta.env.DEV) {
      console.log(`[WaveSystem] Debug killed ${killed} enemies`);
    }

    return killed;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
  }
}
