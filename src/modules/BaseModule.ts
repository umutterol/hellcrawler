import Phaser from 'phaser';
import { ModuleItemData, ModuleSkill, ModuleType } from '../types/ModuleTypes';
import { StatType } from '../types/GameTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';

/**
 * Skill runtime state
 */
interface SkillState {
  skill: ModuleSkill;
  currentCooldown: number;
  isActive: boolean;
  activeTimeRemaining: number;
}

/**
 * BaseModule - Abstract base class for active modules
 *
 * Represents a module that is equipped to a slot and actively functioning.
 * Handles firing behavior, skill management, and stat application.
 *
 * Subclasses implement specific module behaviors (MachineGun, MissilePod, etc.)
 */
export abstract class BaseModule {
  protected scene: Phaser.Scene;
  protected eventManager: EventManager;
  protected projectileGroup: Phaser.GameObjects.Group | null = null;

  // Module data
  protected moduleData: ModuleItemData;
  protected slotIndex: number;
  protected slotLevel: number;

  // Position (relative to tank)
  protected x: number;
  protected y: number;

  // Firing state
  protected lastFireTime: number = 0;
  protected baseFireRate: number = 1000; // ms between shots
  protected baseDamage: number = 10;

  // Skill state
  protected skills: SkillState[] = [];

  // Stats cache (computed from module stats)
  protected cachedStats: Map<StatType, number> = new Map();

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotLevel: number
  ) {
    this.scene = scene;
    this.eventManager = getEventManager();
    this.moduleData = moduleData;
    this.slotIndex = slotIndex;
    this.slotLevel = slotLevel;

    // Default position (will be set by tank)
    this.x = 200;
    this.y = 540;

    // Initialize skills from module data
    this.initializeSkills();

    // Cache stat bonuses
    this.cacheStats();
  }

  /**
   * Set the projectile group for spawning projectiles
   */
  public setProjectileGroup(group: Phaser.GameObjects.Group): void {
    this.projectileGroup = group;
  }

  /**
   * Initialize skill states from module data
   */
  private initializeSkills(): void {
    for (const skill of this.moduleData.skills) {
      this.skills.push({
        skill,
        currentCooldown: 0,
        isActive: false,
        activeTimeRemaining: 0,
      });
    }
  }

  /**
   * Cache stat bonuses for quick access
   */
  private cacheStats(): void {
    this.cachedStats.clear();
    for (const stat of this.moduleData.stats) {
      this.cachedStats.set(stat.type, stat.value);
    }
  }

  /**
   * Get stat value (percentage bonus)
   */
  protected getStat(statType: StatType): number {
    return this.cachedStats.get(statType) ?? 0;
  }

  /**
   * Get the fire rate considering attack speed bonuses
   */
  protected getFireRate(): number {
    const attackSpeedBonus = this.getStat(StatType.AttackSpeed) / 100;
    return this.baseFireRate / (1 + attackSpeedBonus);
  }

  /**
   * Get damage with all bonuses applied
   */
  protected calculateDamage(): { damage: number; isCrit: boolean } {
    const damageBonus = this.getStat(StatType.Damage) / 100;
    const critChance = this.getStat(StatType.CritChance) / 100;
    const critDamageBonus = this.getStat(StatType.CritDamage) / 100;

    // Slot level multiplier: 1 + (slotLevel * 0.01)
    const slotMultiplier = 1 + this.slotLevel * 0.01;

    // Check for crit
    const isCrit = Math.random() < critChance;

    // Calculate final damage
    let damage = this.baseDamage;
    damage *= 1 + damageBonus; // Module damage bonus
    damage *= slotMultiplier; // Slot level bonus
    if (isCrit) {
      damage *= 2.0 + critDamageBonus; // Base 200% crit + bonus
    }

    // Apply variance (90-110%)
    damage *= Phaser.Math.FloatBetween(0.9, 1.1);

    return { damage: Math.floor(damage), isCrit };
  }

  /**
   * Set module position
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Update slot level (when slot is upgraded)
   */
  public setSlotLevel(level: number): void {
    this.slotLevel = level;
  }

  /**
   * Check if module can fire
   */
  protected canFire(currentTime: number): boolean {
    return currentTime - this.lastFireTime >= this.getFireRate();
  }

  /**
   * Fire at enemies - must be implemented by subclasses
   */
  public abstract fire(currentTime: number, enemies: Enemy[]): void;

  /**
   * Update module state (cooldowns, active skills)
   */
  public update(_time: number, delta: number): void {
    // Update skill cooldowns
    for (const skillState of this.skills) {
      if (skillState.currentCooldown > 0) {
        skillState.currentCooldown -= delta;
        if (skillState.currentCooldown <= 0) {
          skillState.currentCooldown = 0;
          this.eventManager.emit(GameEvents.SKILL_COOLDOWN_ENDED, {
            skillId: `${this.moduleData.id}_${skillState.skill.name}`,
            skillName: skillState.skill.name,
            moduleId: this.moduleData.id,
            slotIndex: this.slotIndex,
            cooldownDuration: skillState.skill.cooldown,
          });
        }
      }

      // Update active skill duration
      if (skillState.isActive && skillState.activeTimeRemaining > 0) {
        skillState.activeTimeRemaining -= delta;
        if (skillState.activeTimeRemaining <= 0) {
          skillState.isActive = false;
          skillState.activeTimeRemaining = 0;
          this.onSkillEnd(skillState.skill);
        }
      }
    }
  }

  /**
   * Activate a skill by index (0 or 1)
   */
  public activateSkill(skillIndex: number, enemies: Enemy[]): boolean {
    if (skillIndex < 0 || skillIndex >= this.skills.length) {
      return false;
    }

    const skillState = this.skills[skillIndex]!;

    // Check if on cooldown
    if (skillState.currentCooldown > 0) {
      return false;
    }

    // Activate the skill
    this.onSkillActivate(skillState.skill, enemies);

    // Set duration if applicable
    if (skillState.skill.duration > 0) {
      skillState.isActive = true;
      skillState.activeTimeRemaining = skillState.skill.duration * 1000; // Convert to ms
    }

    // Start cooldown
    const cdrBonus = this.getStat(StatType.CDR) / 100;
    skillState.currentCooldown = skillState.skill.cooldown * 1000 * (1 - cdrBonus);

    // Emit events
    this.eventManager.emit(GameEvents.SKILL_ACTIVATED, {
      skillId: `${this.moduleData.id}_${skillState.skill.name}`,
      skillName: skillState.skill.name,
      moduleId: this.moduleData.id,
      slotIndex: this.slotIndex,
      targetCount: enemies.length,
    });

    this.eventManager.emit(GameEvents.SKILL_COOLDOWN_STARTED, {
      skillId: `${this.moduleData.id}_${skillState.skill.name}`,
      skillName: skillState.skill.name,
      moduleId: this.moduleData.id,
      slotIndex: this.slotIndex,
      cooldownDuration: skillState.currentCooldown,
    });

    return true;
  }

  /**
   * Called when a skill is activated - override in subclasses
   */
  protected abstract onSkillActivate(skill: ModuleSkill, enemies: Enemy[]): void;

  /**
   * Called when a skill duration ends - override in subclasses
   */
  protected abstract onSkillEnd(skill: ModuleSkill): void;

  /**
   * Get skill state for UI
   */
  public getSkillState(skillIndex: number): SkillState | null {
    return this.skills[skillIndex] ?? null;
  }

  /**
   * Check if a skill is on cooldown
   */
  public isSkillOnCooldown(skillIndex: number): boolean {
    const skill = this.skills[skillIndex];
    return skill ? skill.currentCooldown > 0 : true;
  }

  /**
   * Get cooldown remaining (ms)
   */
  public getSkillCooldownRemaining(skillIndex: number): number {
    const skill = this.skills[skillIndex];
    return skill ? skill.currentCooldown : 0;
  }

  /**
   * Check if a skill is currently active
   */
  public isSkillActive(skillIndex: number): boolean {
    const skill = this.skills[skillIndex];
    return skill ? skill.isActive : false;
  }

  /**
   * Get module data
   */
  public getModuleData(): ModuleItemData {
    return this.moduleData;
  }

  /**
   * Get module type
   */
  public getType(): ModuleType {
    return this.moduleData.type;
  }

  /**
   * Get slot index
   */
  public getSlotIndex(): number {
    return this.slotIndex;
  }

  /**
   * Helper: Get projectile from pool
   */
  protected getProjectile(): Projectile | null {
    if (!this.projectileGroup) {
      if (import.meta.env.DEV) {
        console.warn('[BaseModule] No projectile group set!');
      }
      return null;
    }
    return this.projectileGroup.getFirstDead(false) as Projectile | null;
  }

  /**
   * Helper: Find closest enemy
   */
  protected findClosestEnemy(enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * Helper: Find enemies in range
   */
  protected findEnemiesInRange(enemies: Enemy[], range: number): Enemy[] {
    return enemies.filter((enemy) => {
      if (!enemy.isAlive()) return false;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      return dist <= range;
    });
  }

  /**
   * Cleanup when module is removed
   */
  public destroy(): void {
    this.skills = [];
    this.cachedStats.clear();
  }
}
