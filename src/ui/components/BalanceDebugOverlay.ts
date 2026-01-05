import Phaser from 'phaser';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents, DamageDealtPayload, EnemySpawnedPayload } from '../../types/GameEvents';
import { GAME_CONFIG } from '../../config/GameConfig';

/**
 * Damage event record for DPS calculation
 */
interface DamageRecord {
  timestamp: number;
  damage: number;
  isCrit: boolean;
  sourceType: string;
}

/**
 * Enemy tracking record
 */
interface EnemyRecord {
  id: string;
  type: string;
  maxHP: number;
  spawnTime: number;
  deathTime?: number;
}

/**
 * BalanceDebugOverlay - Real-time balance metrics display
 *
 * Shows:
 * - Rolling DPS (3-second window)
 * - Hit rate (shots vs hits)
 * - Enemy TTK (time to kill)
 * - Current enemy HP info
 * - Module damage breakdown
 *
 * Toggle with F3 key
 */
export class BalanceDebugOverlay {
  private scene: Phaser.Scene;
  private eventManager: EventManager;
  private container: Phaser.GameObjects.Container;
  private isVisible: boolean = true;

  // Damage tracking
  private damageRecords: DamageRecord[] = [];
  private readonly DPS_WINDOW_MS = 3000; // 3 second rolling window

  // Enemy tracking
  private activeEnemies: Map<string, EnemyRecord> = new Map();
  private killRecords: EnemyRecord[] = [];
  private readonly TTK_SAMPLE_SIZE = 10; // Last 10 kills for TTK average

  // Shot tracking (crits vs total)
  private totalHits: number = 0;
  private critHits: number = 0;

  // UI elements
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private dpsText!: Phaser.GameObjects.Text;
  private hitRateText!: Phaser.GameObjects.Text;
  private ttkText!: Phaser.GameObjects.Text;
  private enemyInfoText!: Phaser.GameObjects.Text;
  private breakdownText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  // Layout
  private static readonly PADDING = 10;
  private static readonly WIDTH = 220;
  private static readonly LINE_HEIGHT = 18;

  // Damage breakdown by source
  private damageBySource: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventManager = getEventManager();

    // Create container in top-left
    this.container = scene.add.container(10, 10);
    this.container.setDepth(GAME_CONFIG.DEPTH.DEBUG);
    this.container.setScrollFactor(0); // Fixed to camera

    this.createUI();
    this.setupEventListeners();
    this.setupKeyboardToggle();
  }

  private createUI(): void {
    const padding = BalanceDebugOverlay.PADDING;
    const width = BalanceDebugOverlay.WIDTH;
    const lineHeight = BalanceDebugOverlay.LINE_HEIGHT;

    // Background
    this.backgroundGraphics = this.scene.add.graphics();
    this.backgroundGraphics.fillStyle(0x000000, 0.75);
    this.backgroundGraphics.fillRoundedRect(0, 0, width, 200, 6);
    this.backgroundGraphics.lineStyle(1, 0x444444);
    this.backgroundGraphics.strokeRoundedRect(0, 0, width, 200, 6);
    this.container.add(this.backgroundGraphics);

    let y = padding;

    // Title
    this.titleText = this.scene.add.text(padding, y, '⚖️ BALANCE DEBUG', {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffcc00',
    });
    this.container.add(this.titleText);
    y += lineHeight + 4;

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x444444);
    divider.lineBetween(padding, y, width - padding, y);
    this.container.add(divider);
    y += 6;

    // DPS display
    this.dpsText = this.scene.add.text(padding, y, 'DPS: 0', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ff6666',
    });
    this.container.add(this.dpsText);
    y += lineHeight;

    // Hit rate
    this.hitRateText = this.scene.add.text(padding, y, 'Hit Rate: 0%', {
      fontSize: '11px',
      color: '#88ff88',
    });
    this.container.add(this.hitRateText);
    y += lineHeight;

    // TTK
    this.ttkText = this.scene.add.text(padding, y, 'Avg TTK: --', {
      fontSize: '11px',
      color: '#88ccff',
    });
    this.container.add(this.ttkText);
    y += lineHeight;

    // Enemy info
    this.enemyInfoText = this.scene.add.text(padding, y, 'Enemies: 0 | Avg HP: 0', {
      fontSize: '11px',
      color: '#cccccc',
    });
    this.container.add(this.enemyInfoText);
    y += lineHeight + 4;

    // Divider 2
    const divider2 = this.scene.add.graphics();
    divider2.lineStyle(1, 0x333333);
    divider2.lineBetween(padding, y, width - padding, y);
    this.container.add(divider2);
    y += 6;

    // Damage breakdown
    this.breakdownText = this.scene.add.text(padding, y, 'Damage by source:', {
      fontSize: '10px',
      color: '#aaaaaa',
      lineSpacing: 2,
    });
    this.container.add(this.breakdownText);
    y += lineHeight * 3; // Reserve space for breakdown

    // Hint text
    this.hintText = this.scene.add.text(padding, 200 - lineHeight - 4, '[F3] Toggle overlay', {
      fontSize: '9px',
      color: '#666666',
    });
    this.container.add(this.hintText);
  }

  private setupEventListeners(): void {
    // Track damage dealt
    this.eventManager.on(GameEvents.DAMAGE_DEALT, this.onDamageDealt, this);

    // Track enemies spawned
    this.eventManager.on(GameEvents.ENEMY_SPAWNED, this.onEnemySpawned, this);

    // Track enemy deaths (for TTK)
    this.eventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
  }

  private setupKeyboardToggle(): void {
    // Toggle with F3
    this.scene.input.keyboard?.on('keydown-F3', () => {
      this.toggle();
    });
  }

  private onDamageDealt(payload: DamageDealtPayload): void {
    const now = Date.now();

    // Record damage
    this.damageRecords.push({
      timestamp: now,
      damage: payload.damage,
      isCrit: payload.isCrit,
      sourceType: payload.sourceType,
    });

    // Track by source
    const currentDmg = this.damageBySource.get(payload.sourceType) ?? 0;
    this.damageBySource.set(payload.sourceType, currentDmg + payload.damage);

    // Track hits and crits
    this.totalHits++;
    if (payload.isCrit) {
      this.critHits++;
    }

    // Clean old records
    this.cleanOldRecords(now);
  }

  private onEnemySpawned(payload: EnemySpawnedPayload): void {
    this.activeEnemies.set(payload.enemyId, {
      id: payload.enemyId,
      type: payload.enemyType,
      maxHP: payload.health,
      spawnTime: Date.now(),
    });
  }

  private onEnemyDied(payload: { enemyId: string }): void {
    const now = Date.now();
    const enemy = this.activeEnemies.get(payload.enemyId);

    if (enemy) {
      enemy.deathTime = now;

      // Add to kill records for TTK calculation
      this.killRecords.push(enemy);

      // Keep only recent kills
      if (this.killRecords.length > this.TTK_SAMPLE_SIZE) {
        this.killRecords.shift();
      }

      this.activeEnemies.delete(payload.enemyId);
    }
  }

  private cleanOldRecords(now: number): void {
    // Remove damage records outside the window
    const cutoff = now - this.DPS_WINDOW_MS;
    this.damageRecords = this.damageRecords.filter((r) => r.timestamp >= cutoff);
  }

  /**
   * Calculate rolling DPS over the window
   */
  private calculateDPS(): number {
    if (this.damageRecords.length === 0) return 0;

    const totalDamage = this.damageRecords.reduce((sum, r) => sum + r.damage, 0);
    const windowSeconds = this.DPS_WINDOW_MS / 1000;

    return Math.round(totalDamage / windowSeconds);
  }

  /**
   * Calculate average TTK from recent kills
   */
  private calculateAverageTTK(): number | null {
    if (this.killRecords.length < 2) return null;

    let totalTTK = 0;
    let validKills = 0;

    for (const kill of this.killRecords) {
      if (kill.deathTime && kill.spawnTime) {
        const ttk = (kill.deathTime - kill.spawnTime) / 1000;
        // Filter out instant kills (likely bugs) and very long kills
        if (ttk > 0.1 && ttk < 60) {
          totalTTK += ttk;
          validKills++;
        }
      }
    }

    return validKills > 0 ? totalTTK / validKills : null;
  }

  /**
   * Calculate crit rate percentage
   */
  private calculateCritRate(): number {
    if (this.totalHits === 0) return 0;
    return Math.round((this.critHits / this.totalHits) * 100);
  }

  /**
   * Get damage breakdown string
   */
  private getBreakdownString(): string {
    const entries = Array.from(this.damageBySource.entries());
    if (entries.length === 0) return 'No damage yet';

    const total = entries.reduce((sum, [, dmg]) => sum + dmg, 0);

    return entries
      .map(([source, dmg]) => {
        const percent = Math.round((dmg / total) * 100);
        return `  ${source}: ${this.formatNumber(dmg)} (${percent}%)`;
      })
      .join('\n');
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
  }

  /**
   * Show overlay
   */
  public show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
  }

  /**
   * Hide overlay
   */
  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  /**
   * Reset all tracking data
   */
  public reset(): void {
    this.damageRecords = [];
    this.activeEnemies.clear();
    this.killRecords = [];
    this.totalHits = 0;
    this.critHits = 0;
    this.damageBySource.clear();
  }

  /**
   * Update display - call each frame
   */
  public update(): void {
    if (!this.isVisible) return;

    const now = Date.now();
    this.cleanOldRecords(now);

    // Update DPS
    const dps = this.calculateDPS();
    const dpsColor = dps < 20 ? '#ff4444' : dps < 50 ? '#ffaa44' : '#44ff44';
    this.dpsText.setText(`DPS: ${dps}`);
    this.dpsText.setColor(dpsColor);

    // Update crit rate and total hits
    const critRate = this.calculateCritRate();
    this.hitRateText.setText(`Crits: ${critRate}% (${this.critHits}/${this.totalHits} hits)`);

    // Update TTK
    const avgTTK = this.calculateAverageTTK();
    if (avgTTK !== null) {
      const ttkColor = avgTTK > 4 ? '#ff4444' : avgTTK > 2 ? '#ffaa44' : '#44ff44';
      this.ttkText.setText(`Avg TTK: ${avgTTK.toFixed(2)}s`);
      this.ttkText.setColor(ttkColor);
    } else {
      this.ttkText.setText('Avg TTK: --');
      this.ttkText.setColor('#888888');
    }

    // Update enemy info
    const enemyCount = this.activeEnemies.size;
    let avgHP = 0;
    if (enemyCount > 0) {
      const totalHP = Array.from(this.activeEnemies.values()).reduce((sum, e) => sum + e.maxHP, 0);
      avgHP = Math.round(totalHP / enemyCount);
    }
    this.enemyInfoText.setText(`Enemies: ${enemyCount} | Avg HP: ${avgHP}`);

    // Update breakdown
    this.breakdownText.setText('Damage by source:\n' + this.getBreakdownString());
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.DAMAGE_DEALT, this.onDamageDealt, this);
    this.eventManager.off(GameEvents.ENEMY_SPAWNED, this.onEnemySpawned, this);
    this.eventManager.off(GameEvents.ENEMY_DIED, this.onEnemyDied, this);

    this.container.destroy(true);
  }
}
