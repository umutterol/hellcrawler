/**
 * TankStore - Manages tank progression, stats, and combat state
 *
 * Extracted from monolithic GameState. Handles:
 * - Tank level and XP
 * - Base stats (MaxHP, Defense, HPRegen)
 * - Stat levels (skill point investments)
 * - Tank stat levels (gold-based upgrades)
 * - Damage, healing, and near-death mechanics
 */

import { TankStats, StatType, TankStatType } from '../types/GameTypes';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG, BALANCE } from '../config/GameConfig';
import { calculateXPRequired, calculateUpgradeCost } from '../config/Constants';
import { BaseStore } from './BaseStore';

export interface TankStoreData {
  level: number;
  xp: number;
  stats: TankStats;
  statLevels: Record<string, number>;
  tankStatLevels?: Record<string, number>;
}

export class TankStore extends BaseStore<TankStoreData> {
  private static instance: TankStore | null = null;

  private tankLevel: number;
  private tankXP: number;
  private tankStats: TankStats;
  private statLevels: Map<StatType, number>;
  private tankStatLevels: Map<TankStatType, number>;

  private constructor() {
    super('tank');
    const defaults = TankStore.getDefaults();
    this.tankLevel = defaults.level;
    this.tankXP = defaults.xp;
    this.tankStats = { ...defaults.stats };
    this.statLevels = new Map(
      Object.entries(defaults.statLevels) as [StatType, number][]
    );
    this.tankStatLevels = new Map([
      [TankStatType.MaxHP, 0],
      [TankStatType.Defense, 0],
      [TankStatType.HPRegen, 0],
    ]);
  }

  public static getInstance(): TankStore {
    if (!TankStore.instance) {
      TankStore.instance = new TankStore();
    }
    return TankStore.instance;
  }

  public static getDefaults(): TankStoreData {
    return {
      level: 1,
      xp: 0,
      stats: {
        maxHP: BALANCE.TANK_MAX_HP_BASE,
        currentHP: BALANCE.TANK_MAX_HP_BASE,
        defense: 0,
        hpRegen: BALANCE.TANK_REGEN_BASE,
      },
      statLevels: {
        [StatType.Damage]: 0,
        [StatType.AttackSpeed]: 0,
        [StatType.CritChance]: 0,
        [StatType.CritDamage]: 0,
        [StatType.CDR]: 0,
        [StatType.AoE]: 0,
        [StatType.Lifesteal]: 0,
        [StatType.Multistrike]: 0,
        [StatType.Range]: 0,
        [StatType.GoldFind]: 0,
        [StatType.XPBonus]: 0,
      },
    };
  }

  // ============================================================================
  // XP & LEVELING
  // ============================================================================

  public addXP(amount: number, source: 'enemy' | 'boss' | 'wave_completion' = 'enemy'): void {
    const xpBonus = (this.statLevels.get(StatType.XPBonus) || 0) / 100;
    const actualAmount = Math.floor(amount * (1 + xpBonus));

    this.tankXP += actualAmount;

    this.eventManager.emit(GameEvents.XP_GAINED, {
      amount: actualAmount,
      currentXp: this.tankXP,
      xpToNextLevel: calculateXPRequired(this.tankLevel),
      source,
    });

    while (
      this.tankXP >= calculateXPRequired(this.tankLevel) &&
      this.tankLevel < GAME_CONFIG.MAX_TANK_LEVEL
    ) {
      this.levelUp();
    }

    this.emitChange('xp');
  }

  private levelUp(): void {
    const previousLevel = this.tankLevel;
    this.tankLevel += 1;

    const xpRequired = calculateXPRequired(previousLevel);
    this.tankXP -= xpRequired;

    const skillPointsAwarded = 1;
    const totalSkillPoints = this.getTotalSkillPoints();

    this.eventManager.emit(GameEvents.LEVEL_UP, {
      previousLevel,
      newLevel: this.tankLevel,
      skillPointsAwarded,
      totalSkillPoints,
    });

    if (import.meta.env.DEV) {
      console.log(
        `[TankStore] Level up! ${previousLevel} -> ${this.tankLevel} (${totalSkillPoints} total skill points)`
      );
    }
  }

  private getTotalSkillPoints(): number {
    const earnedPoints = this.tankLevel - 1;
    const spentPoints = Array.from(this.statLevels.values()).reduce(
      (sum, level) => sum + level,
      0
    );
    return earnedPoints - spentPoints;
  }

  // ============================================================================
  // STAT UPGRADES
  // ============================================================================

  public upgradeStat(stat: StatType): boolean {
    const availablePoints = this.getTotalSkillPoints();

    if (availablePoints <= 0) {
      if (import.meta.env.DEV) {
        console.warn('[TankStore] No skill points available for upgrade');
      }
      return false;
    }

    const currentLevel = this.statLevels.get(stat) || 0;
    this.statLevels.set(stat, currentLevel + 1);
    this.emitChange('statLevels');

    if (import.meta.env.DEV) {
      console.log(
        `[TankStore] Upgraded ${stat} to level ${currentLevel + 1} (${this.getTotalSkillPoints()} points remaining)`
      );
    }

    return true;
  }

  /**
   * Upgrade a tank stat using gold.
   * Returns the cost if upgrade is possible, or -1 if not.
   * The caller (GameState facade) handles the gold spending.
   */
  public upgradeTankStat(stat: TankStatType): { success: boolean; cost: number } {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;

    if (currentLevel >= this.tankLevel) {
      if (import.meta.env.DEV) {
        console.warn(
          `[TankStore] Tank stat ${stat} at cap (${currentLevel}/${this.tankLevel})`
        );
      }
      return { success: false, cost: 0 };
    }

    const cost = (currentLevel + 1) * 100;
    return { success: true, cost };
  }

  /**
   * Apply a tank stat upgrade after gold has been spent
   */
  public applyTankStatUpgrade(stat: TankStatType): void {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;
    this.tankStatLevels.set(stat, currentLevel + 1);
    this.applyTankStatBonus(stat, currentLevel + 1);

    const cost = (currentLevel + 1) * 100;
    this.eventManager.emit(GameEvents.TANK_STAT_UPGRADED, {
      stat,
      newLevel: currentLevel + 1,
      newValue: this.getTankStatValue(stat),
      cost,
    });

    this.emitChange('tankStatLevels');

    if (import.meta.env.DEV) {
      console.log(
        `[TankStore] Upgraded tank stat ${stat} to level ${currentLevel + 1} for ${cost} gold`
      );
    }
  }

  private getTankStatValue(stat: TankStatType): number {
    switch (stat) {
      case TankStatType.MaxHP:
        return this.tankStats.maxHP;
      case TankStatType.Defense:
        return this.tankStats.defense;
      case TankStatType.HPRegen:
        return this.tankStats.hpRegen;
      default:
        return 0;
    }
  }

  private applyTankStatBonus(stat: TankStatType, level: number): void {
    switch (stat) {
      case TankStatType.MaxHP: {
        const newMaxHP = BALANCE.TANK_MAX_HP_BASE + level * BALANCE.TANK_MAX_HP_PER_LEVEL;
        if (this.tankStats.maxHP > 0) {
          const hpRatio = this.tankStats.currentHP / this.tankStats.maxHP;
          this.tankStats.currentHP = Math.floor(newMaxHP * hpRatio);
        }
        this.tankStats.maxHP = newMaxHP;
        break;
      }
      case TankStatType.Defense:
        this.tankStats.defense = level * BALANCE.TANK_DEFENSE_PER_LEVEL;
        break;
      case TankStatType.HPRegen:
        this.tankStats.hpRegen = BALANCE.TANK_REGEN_BASE + level * BALANCE.TANK_REGEN_PER_LEVEL;
        break;
    }
  }

  // ============================================================================
  // COMBAT
  // ============================================================================

  public takeDamage(amount: number, sourceId: string, sourceType: 'enemy' | 'boss'): void {
    const previousHP = this.tankStats.currentHP;

    const defenseReduction = this.tankStats.defense / (this.tankStats.defense + 100);
    const actualDamage = Math.floor(amount * (1 - defenseReduction));

    this.tankStats.currentHP = Math.max(1, this.tankStats.currentHP - actualDamage);

    this.eventManager.emit(GameEvents.DAMAGE_TAKEN, {
      targetId: 'player-tank',
      targetType: 'tank',
      sourceId,
      sourceType,
      damage: actualDamage,
      remainingHealth: this.tankStats.currentHP,
      maxHealth: this.tankStats.maxHP,
    });

    const healthPercent = this.tankStats.currentHP / this.tankStats.maxHP;
    const wasAboveThreshold = previousHP / this.tankStats.maxHP >= 0.2;
    const isNowBelowThreshold = healthPercent < 0.2;

    if (wasAboveThreshold && isNowBelowThreshold) {
      this.eventManager.emit(GameEvents.NEAR_DEATH_ENTERED, {
        currentHealth: this.tankStats.currentHP,
        maxHealth: this.tankStats.maxHP,
        threshold: 0.2,
        reviveTimeRemaining: GAME_CONFIG.NEAR_DEATH_REVIVE_TIME,
      });
    }

    this.emitChange('currentHP');
  }

  public heal(
    amount: number,
    source: 'regen' | 'repair_drone' | 'skill' | 'revive' | 'other' = 'other'
  ): void {
    const previousHP = this.tankStats.currentHP;
    this.tankStats.currentHP = Math.round(
      Math.min(this.tankStats.maxHP, this.tankStats.currentHP + amount) * 100
    ) / 100;

    const actualHeal = this.tankStats.currentHP - previousHP;

    if (actualHeal > 0) {
      this.eventManager.emit(GameEvents.TANK_HEALED, {
        amount: actualHeal,
        currentHealth: this.tankStats.currentHP,
        maxHealth: this.tankStats.maxHP,
        source,
      });

      this.emitChange('currentHP');
    }
  }

  public revive(): void {
    const restoredHealth = Math.floor(this.tankStats.maxHP * 0.5);
    this.tankStats.currentHP = restoredHealth;

    this.eventManager.emit(GameEvents.TANK_REVIVED, {
      restoredHealth,
      maxHealth: this.tankStats.maxHP,
      cooldownDuration: GAME_CONFIG.NEAR_DEATH_REVIVE_TIME,
    });

    this.emitChange('currentHP');
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getTankLevel(): number {
    return this.tankLevel;
  }

  public getTankXP(): number {
    return this.tankXP;
  }

  public getTankStats(): Readonly<TankStats> {
    return { ...this.tankStats };
  }

  public getStatLevel(stat: StatType): number {
    return this.statLevels.get(stat) || 0;
  }

  public getTankStatLevel(stat: TankStatType): number {
    return this.tankStatLevels.get(stat) ?? 0;
  }

  public getTankStatUpgradeCost(stat: TankStatType): number {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;
    return (currentLevel + 1) * 100;
  }

  public canUpgradeTankStat(stat: TankStatType): boolean {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;
    return currentLevel < this.tankLevel;
  }

  public getAvailableSkillPoints(): number {
    return this.getTotalSkillPoints();
  }

  public getXPToNextLevel(): number {
    return calculateXPRequired(this.tankLevel);
  }

  public getStatUpgradeCost(stat: StatType): number {
    const currentLevel = this.statLevels.get(stat) || 0;
    return calculateUpgradeCost(currentLevel);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public serialize(): TankStoreData {
    return {
      level: this.tankLevel,
      xp: this.tankXP,
      stats: { ...this.tankStats },
      statLevels: Object.fromEntries(this.statLevels),
      tankStatLevels: Object.fromEntries(this.tankStatLevels),
    };
  }

  public deserialize(data: TankStoreData): void {
    this.tankLevel = data.level;
    this.tankXP = data.xp;
    this.tankStats = { ...data.stats };
    this.statLevels = new Map(Object.entries(data.statLevels) as [StatType, number][]);

    if (data.tankStatLevels) {
      this.tankStatLevels = new Map(
        Object.entries(data.tankStatLevels) as [TankStatType, number][]
      );
    } else {
      this.tankStatLevels = new Map([
        [TankStatType.MaxHP, 0],
        [TankStatType.Defense, 0],
        [TankStatType.HPRegen, 0],
      ]);
    }
  }

  public reset(): void {
    const defaults = TankStore.getDefaults();
    this.deserialize(defaults);
  }
}

export function getTankStore(): TankStore {
  return TankStore.getInstance();
}
