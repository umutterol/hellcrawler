import Phaser from 'phaser';
import { ModuleItem } from '../modules/ModuleItem';
import { ModuleType } from '../types/ModuleTypes';
import { Rarity } from '../types/GameTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents, EnemyDiedPayload } from '../types/GameEvents';
import { EnemyCategory } from '../types/EnemyTypes';
import { getGameState } from '../state/GameState';

/**
 * Drop rate configuration
 * Base % + Per 10 Levels bonus (up to level 160)
 */
interface DropRate {
  base: number;
  perTenLevels: number;
  max: number;
}

const DROP_RATES: Record<Rarity, DropRate> = {
  [Rarity.Uncommon]: { base: 10, perTenLevels: 1, max: 26 },
  [Rarity.Rare]: { base: 3, perTenLevels: 0.5, max: 11 },
  [Rarity.Epic]: { base: 0.5, perTenLevels: 0.2, max: 3.7 },
  [Rarity.Legendary]: { base: 0.05, perTenLevels: 0.05, max: 0.85 },
};

/**
 * Drop chance modifiers by enemy category
 */
const CATEGORY_DROP_MODIFIERS: Record<EnemyCategory, number> = {
  [EnemyCategory.Fodder]: 0.3, // 30% of base drop chance
  [EnemyCategory.Elite]: 1.5, // 150% of base
  [EnemyCategory.SuperElite]: 3.0, // 300% of base
  [EnemyCategory.Boss]: 1.0, // Bosses have guaranteed drops handled separately
};

/**
 * Available module types for random drops
 * Only drops types that are implemented
 */
const DROPPABLE_MODULE_TYPES: ModuleType[] = [
  ModuleType.MachineGun,
  ModuleType.MissilePod,
  ModuleType.RepairDrone,
  // Future: Add more as they're implemented
];

/**
 * LootSystem - Handles module drops and loot generation
 *
 * Features:
 * - Drop rate calculations based on tank level
 * - Enemy category modifiers
 * - Boss guaranteed drops
 * - Visual loot drops (coming soon)
 */
export class LootSystem {
  private scene: Phaser.Scene;
  private eventManager: EventManager;
  private gameState: ReturnType<typeof getGameState>;

  // Pending drops (modules that dropped but need to be picked up)
  private pendingDrops: Map<string, { module: ModuleItem; x: number; y: number }> = new Map();

  // Drop visuals
  private dropSprites: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventManager = getEventManager();
    this.gameState = getGameState();

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.eventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
    this.eventManager.on(GameEvents.BOSS_DEFEATED, this.onBossDefeated, this);
  }

  /**
   * Handle enemy death - roll for drops
   */
  private onEnemyDied(payload: EnemyDiedPayload): void {
    // Get enemy category from type
    const category = this.getCategoryFromType(payload.enemyType);

    // Roll for module drop
    const module = this.rollForDrop(category);
    if (module) {
      // For now, add directly to inventory (visual drops later)
      this.gameState.addToInventory(module.getData());
      const added = true;

      if (added) {
        this.eventManager.emit(GameEvents.MODULE_DROPPED, {
          moduleId: module.getId(),
          rarity: module.getRarity() as 'uncommon' | 'rare' | 'epic' | 'legendary',
          type: module.getType(),
          x: 0, // Position not relevant for auto-pickup
          y: 0,
          droppedBy: payload.enemyId,
        });

        if (import.meta.env.DEV) {
          console.log(
            `[LootSystem] Dropped ${module.getRarityName()} ${module.getTypeName()} ` +
            `from ${payload.enemyType}`
          );
        }
      }
    }
  }

  /**
   * Handle boss defeat - guaranteed drop
   */
  private onBossDefeated(payload: { bossId: string; guaranteedModuleRarity: 'epic' | 'legendary' }): void {
    // Guaranteed module drop for boss
    const rarity = payload.guaranteedModuleRarity === 'legendary'
      ? Rarity.Legendary
      : Rarity.Epic;

    const moduleType = this.getRandomModuleType();
    const module = ModuleItem.generate(moduleType, rarity);

    this.gameState.addToInventory(module.getData());
    const added = true;

    if (added) {
      this.eventManager.emit(GameEvents.MODULE_DROPPED, {
        moduleId: module.getId(),
        rarity: module.getRarity() as 'uncommon' | 'rare' | 'epic' | 'legendary',
        type: module.getType(),
        x: 0,
        y: 0,
        droppedBy: payload.bossId,
      });

      if (import.meta.env.DEV) {
        console.log(
          `[LootSystem] Boss guaranteed drop: ${module.getRarityName()} ${module.getTypeName()}`
        );
      }
    }
  }

  /**
   * Roll for a module drop based on enemy category
   */
  private rollForDrop(category: EnemyCategory): ModuleItem | null {
    const tankLevel = this.gameState.getTankLevel();
    const categoryModifier = CATEGORY_DROP_MODIFIERS[category];

    // Roll from highest rarity to lowest
    const rarities: Rarity[] = [
      Rarity.Legendary,
      Rarity.Epic,
      Rarity.Rare,
      Rarity.Uncommon,
    ];

    for (const rarity of rarities) {
      const dropChance = this.calculateDropChance(rarity, tankLevel) * categoryModifier;

      if (Math.random() * 100 < dropChance) {
        const moduleType = this.getRandomModuleType();
        return ModuleItem.generate(moduleType, rarity);
      }
    }

    return null;
  }

  /**
   * Calculate drop chance for a rarity at a given tank level
   */
  private calculateDropChance(rarity: Rarity, tankLevel: number): number {
    const rate = DROP_RATES[rarity];
    const levelBonus = Math.floor(tankLevel / 10) * rate.perTenLevels;
    return Math.min(rate.base + levelBonus, rate.max);
  }

  /**
   * Get a random module type from available types
   */
  private getRandomModuleType(): ModuleType {
    const index = Math.floor(Math.random() * DROPPABLE_MODULE_TYPES.length);
    return DROPPABLE_MODULE_TYPES[index]!;
  }

  /**
   * Map enemy type string to category
   */
  private getCategoryFromType(enemyType: string): EnemyCategory {
    // This is a simplified mapping - in real implementation,
    // we'd get this from the enemy config
    const fodderTypes = ['imp', 'hellhound', 'possessedSoldier', 'fireSkull'];
    const eliteTypes = ['demon', 'necromancer', 'shadowFiend', 'infernalWarrior'];
    const superEliteTypes = ['archDemon', 'voidReaver'];
    const bossTypes = ['infernalWarlord', 'lordOfFlames'];

    if (fodderTypes.includes(enemyType)) return EnemyCategory.Fodder;
    if (eliteTypes.includes(enemyType)) return EnemyCategory.Elite;
    if (superEliteTypes.includes(enemyType)) return EnemyCategory.SuperElite;
    if (bossTypes.includes(enemyType)) return EnemyCategory.Boss;

    return EnemyCategory.Fodder;
  }

  /**
   * Create visual drop at position (for future implementation)
   */
  public createDropVisual(module: ModuleItem, x: number, y: number): void {
    const dropId = module.getId();

    // Create container for drop visual
    const container = this.scene.add.container(x, y);

    // Background glow based on rarity
    const glowColor = module.getRarityColor();
    const glow = this.scene.add.circle(0, 0, 20, glowColor, 0.5);
    container.add(glow);

    // Module icon (placeholder)
    const icon = this.scene.add.rectangle(0, 0, 16, 16, glowColor);
    container.add(icon);

    // Pulsing animation
    this.scene.tweens.add({
      targets: glow,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.3, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Floating animation
    this.scene.tweens.add({
      targets: container,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.dropSprites.set(dropId, container);
    this.pendingDrops.set(dropId, { module, x, y });
  }

  /**
   * Collect a drop
   */
  public collectDrop(dropId: string): ModuleItem | null {
    const drop = this.pendingDrops.get(dropId);
    if (!drop) return null;

    // Remove visual
    const sprite = this.dropSprites.get(dropId);
    if (sprite) {
      sprite.destroy();
      this.dropSprites.delete(dropId);
    }

    this.pendingDrops.delete(dropId);
    return drop.module;
  }

  /**
   * Get all pending drops
   */
  public getPendingDrops(): { id: string; module: ModuleItem; x: number; y: number }[] {
    return Array.from(this.pendingDrops.entries()).map(([id, data]) => ({
      id,
      module: data.module,
      x: data.x,
      y: data.y,
    }));
  }

  /**
   * Update - check for auto-pickup
   */
  public update(_time: number, _delta: number): void {
    // Future: Check if player is near drops and auto-collect
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
    this.eventManager.off(GameEvents.BOSS_DEFEATED, this.onBossDefeated, this);

    // Destroy all drop visuals
    for (const sprite of this.dropSprites.values()) {
      sprite.destroy();
    }
    this.dropSprites.clear();
    this.pendingDrops.clear();
  }
}
