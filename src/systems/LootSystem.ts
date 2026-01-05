import Phaser from 'phaser';
import { ModuleItem } from '../modules/ModuleItem';
import { ModuleType } from '../types/ModuleTypes';
import { Rarity } from '../types/GameTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents, EnemyDiedPayload } from '../types/GameEvents';
import { EnemyCategory } from '../types/EnemyTypes';
import { getGameState } from '../state/GameState';
import { BALANCE } from '../config/GameConfig';

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
      // Get drop position from enemy position
      const dropX = payload.x ?? 0;
      const dropY = payload.y ?? 0;

      // For now, add directly to inventory (visual drops later)
      // Pass drop position for auto-sell notification
      const added = this.gameState.addToInventory(module.getData(), { x: dropX, y: dropY });

      // Only emit MODULE_DROPPED if actually added to inventory (not auto-sold)
      if (added) {
        this.eventManager.emit(GameEvents.MODULE_DROPPED, {
          moduleId: module.getId(),
          rarity: module.getRarity() as 'uncommon' | 'rare' | 'epic' | 'legendary',
          type: module.getType(),
          x: dropX,
          y: dropY,
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
   * Uses BALANCE constants for drop rates
   */
  private rollForDrop(category: EnemyCategory): ModuleItem | null {
    const tankLevel = this.gameState.getTankLevel();

    // Get base drop chance for this category from BALANCE
    const categoryKey = category as keyof typeof BALANCE.MODULE_DROP_CHANCE;
    const baseDropChance = BALANCE.MODULE_DROP_CHANCE[categoryKey] || BALANCE.MODULE_DROP_CHANCE.fodder;

    // Add level bonus: +0.1% per 10 levels
    const levelBonus = Math.floor(tankLevel / 10) * BALANCE.DROP_LEVEL_BONUS_PER_10;
    const finalDropChance = Math.min(baseDropChance + levelBonus, BALANCE.DROP_CHANCE_CAP);

    // Super Elite and Boss have guaranteed drops
    const isGuaranteed = category === EnemyCategory.SuperElite || category === EnemyCategory.Boss;

    // First check if we get a drop at all
    if (!isGuaranteed && Math.random() > finalDropChance) {
      return null; // No drop
    }

    // We're getting a drop - now roll for rarity
    const rarity = this.rollRarity(tankLevel, category);
    const moduleType = this.getRandomModuleType();

    if (import.meta.env.DEV) {
      console.log(`[LootSystem] Drop rolled: ${category} -> ${rarity} (chance was ${(finalDropChance * 100).toFixed(2)}%)`);
    }

    return ModuleItem.generate(moduleType, rarity);
  }

  /**
   * Roll for rarity using BALANCE thresholds
   * Elite enemies get a rarity boost
   * Bosses have a minimum rarity floor
   */
  private rollRarity(tankLevel: number, category: EnemyCategory): Rarity {
    const roll = Math.random() * 100;

    // Calculate level-scaled thresholds
    const levelTens = Math.floor(tankLevel / 10);

    const legendaryChance = BALANCE.RARITY_THRESHOLDS.legendary +
      levelTens * BALANCE.RARITY_LEVEL_SCALE.legendary;
    const epicChance = BALANCE.RARITY_THRESHOLDS.epic +
      levelTens * BALANCE.RARITY_LEVEL_SCALE.epic;
    const rareChance = BALANCE.RARITY_THRESHOLDS.rare +
      levelTens * BALANCE.RARITY_LEVEL_SCALE.rare;
    const uncommonChance = BALANCE.RARITY_THRESHOLDS.uncommon +
      levelTens * BALANCE.RARITY_LEVEL_SCALE.uncommon;

    // Apply elite rarity boost (multiply thresholds)
    const rarityBoost = category === EnemyCategory.Elite ? BALANCE.ELITE_RARITY_BOOST : 1.0;

    // Determine rarity (cumulative)
    let rarity: Rarity;
    if (roll < legendaryChance * rarityBoost) {
      rarity = Rarity.Legendary;
    } else if (roll < (legendaryChance + epicChance) * rarityBoost) {
      rarity = Rarity.Epic;
    } else if (roll < (legendaryChance + epicChance + rareChance) * rarityBoost) {
      rarity = Rarity.Rare;
    } else if (roll < (legendaryChance + epicChance + rareChance + uncommonChance) * rarityBoost) {
      rarity = Rarity.Uncommon;
    } else {
      rarity = Rarity.Uncommon; // Default to uncommon
    }

    // Apply boss minimum rarity floor (at least rare)
    if (category === EnemyCategory.Boss && rarity === Rarity.Uncommon) {
      rarity = Rarity.Rare;
    }

    // Super elite gets at least rare
    if (category === EnemyCategory.SuperElite && rarity === Rarity.Uncommon) {
      rarity = Rarity.Rare;
    }

    return rarity;
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
    const bossTypes = ['corruptedSentinel', 'infernalWarlord', 'lordOfFlames'];

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
