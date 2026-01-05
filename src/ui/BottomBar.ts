import Phaser from 'phaser';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameState, getGameState } from '../state/GameState';
import { ModuleManager } from '../modules/ModuleManager';
import { ModuleSlot } from '../modules/ModuleSlot';
import { BaseModule } from '../modules/BaseModule';
import { GameEvents } from '../types/GameEvents';
import { UI_CONFIG } from '../config/UIConfig';
import { GAME_CONFIG, SlotDirection } from '../config/GameConfig';

/**
 * BottomBar - Fixed bar at bottom of screen
 *
 * Contains:
 * - HP bar (full width at top of bar)
 * - Module slots (5 slots with cooldowns)
 * - Wave progress indicator
 * - Near Death revive button
 *
 * Height: 120px (from UIConfig)
 */
export class BottomBar {
  private scene: Phaser.Scene;
  private eventManager: EventManager;
  private gameState: GameState;
  private moduleManager: ModuleManager;

  // Container
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;

  // HP Bar elements
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private nearDeathButton!: Phaser.GameObjects.Container;
  private nearDeathText!: Phaser.GameObjects.Text;

  // Module slot elements
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private slotBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private slotIcons: Phaser.GameObjects.Rectangle[] = [];
  private slotLevelTexts: Phaser.GameObjects.Text[] = [];
  private slotLockIcons: (Phaser.GameObjects.Text | null)[] = [];
  private skill1Cooldowns: Phaser.GameObjects.Graphics[] = [];
  private skill2Cooldowns: Phaser.GameObjects.Graphics[] = [];
  private skill1Keys: Phaser.GameObjects.Text[] = [];
  private skill2Keys: Phaser.GameObjects.Text[] = [];
  private skill1Autos: Phaser.GameObjects.Text[] = [];
  private skill2Autos: Phaser.GameObjects.Text[] = [];
  private directionIndicators: Phaser.GameObjects.Text[] = [];

  // Maps visual position to actual slot index (for display order)
  private displayOrderMap: readonly number[] = UI_CONFIG.SLOT_DISPLAY_ORDER;

  // Wave progress elements
  private waveText!: Phaser.GameObjects.Text;
  private waveProgressBg!: Phaser.GameObjects.Graphics;
  private waveProgress!: Phaser.GameObjects.Graphics;
  private enemyCountText!: Phaser.GameObjects.Text;

  // Constants - Compact layout for 60px height
  private readonly HEIGHT = UI_CONFIG.BOTTOM_BAR.HEIGHT;
  private readonly HP_BAR_HEIGHT = 18;
  private readonly SLOT_SIZE = 36;
  private readonly SLOT_SPACING = 6;
  private readonly SKILL_INDICATOR_SIZE = 14;
  private readonly PADDING = 12;

  // Rarity colors
  private readonly RARITY_COLORS: Record<string, number> = {
    uncommon: 0x4ade80,
    rare: 0x60a5fa,
    epic: 0xc084fc,
    legendary: 0xfb923c,
  };

  // Module type colors
  private readonly MODULE_COLORS: Record<string, number> = {
    machineGun: 0xffff00,
    missilePod: 0xff4444,
    repairDrone: 0x00ff88,
  };

  // State
  private currentWave: number = 0;
  private totalEnemies: number = 0;
  private remainingEnemies: number = 0;

  constructor(scene: Phaser.Scene, moduleManager: ModuleManager) {
    this.scene = scene;
    this.eventManager = getEventManager();
    this.gameState = getGameState();
    this.moduleManager = moduleManager;

    this.createContainer();
    this.createBackground();
    this.createHPBar();
    this.createModuleSlots();
    this.createWaveProgress();
    this.subscribeToEvents();
    this.updateAll();
  }

  private createContainer(): void {
    const y = GAME_CONFIG.HEIGHT - this.HEIGHT;
    this.container = this.scene.add.container(0, y);
    this.container.setDepth(UI_CONFIG.DEPTHS.HUD);
  }

  private createBackground(): void {
    this.background = this.scene.add.graphics();
    // Transparent background for desktop mode - just a subtle top border
    this.background.lineStyle(1, 0x3d3d5c, 0.5);
    this.background.lineBetween(0, 0, GAME_CONFIG.WIDTH, 0);

    this.container.add(this.background);
  }

  private getHPBarWidth(): number {
    // Match the module slots width: 5 slots + 4 gaps
    return 5 * this.SLOT_SIZE + 4 * this.SLOT_SPACING;
  }

  private getCenteredStartX(): number {
    const totalWidth = this.getHPBarWidth();
    return (GAME_CONFIG.WIDTH - totalWidth) / 2;
  }

  private createHPBar(): void {
    const hpBarWidth = this.getHPBarWidth();
    const hpBarY = 4;
    const startX = this.getCenteredStartX();

    // HP Bar background
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRoundedRect(startX, hpBarY, hpBarWidth, this.HP_BAR_HEIGHT, 4);
    this.hpBarBg.lineStyle(1, 0x555555, 1);
    this.hpBarBg.strokeRoundedRect(startX, hpBarY, hpBarWidth, this.HP_BAR_HEIGHT, 4);
    this.container.add(this.hpBarBg);

    // HP Bar fill
    this.hpBar = this.scene.add.graphics();
    this.container.add(this.hpBar);

    // HP Text (centered on bar)
    this.hpText = this.scene.add.text(startX + hpBarWidth / 2, hpBarY + this.HP_BAR_HEIGHT / 2, '', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.hpText.setOrigin(0.5, 0.5);
    this.container.add(this.hpText);

    // Near Death revive button (hidden by default)
    this.createNearDeathButton(hpBarY, hpBarWidth, startX);

    // Initial HP update
    this.updateHPBar();
  }

  private createNearDeathButton(hpBarY: number, hpBarWidth: number, startX: number): void {
    const buttonWidth = 100;
    const buttonHeight = this.HP_BAR_HEIGHT;
    const buttonX = startX + hpBarWidth + 10;

    this.nearDeathButton = this.scene.add.container(buttonX, hpBarY);
    this.nearDeathButton.setVisible(false);

    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0xff0000, 0.8);
    buttonBg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
    buttonBg.lineStyle(2, 0xff6666, 1);
    buttonBg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
    this.nearDeathButton.add(buttonBg);

    // Button text
    this.nearDeathText = this.scene.add.text(buttonWidth / 2, buttonHeight / 2, 'REVIVE', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.nearDeathText.setOrigin(0.5, 0.5);
    this.nearDeathButton.add(this.nearDeathText);

    // Make interactive
    const hitArea = this.scene.add.rectangle(buttonWidth / 2, buttonHeight / 2, buttonWidth, buttonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.gameState.revive();
    });
    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0xff4444, 0.9);
      buttonBg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
      buttonBg.lineStyle(2, 0xffaaaa, 1);
      buttonBg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
    });
    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0xff0000, 0.8);
      buttonBg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
      buttonBg.lineStyle(2, 0xff6666, 1);
      buttonBg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 4);
    });
    this.nearDeathButton.add(hitArea);

    this.container.add(this.nearDeathButton);
  }

  private createModuleSlots(): void {
    const startX = this.getCenteredStartX();
    const y = this.HP_BAR_HEIGHT + 8; // Closer to HP bar

    // Create 5 slot UI elements using display order
    // Display order: [Back2, Back4, Center5, Front3, Front1] = [1, 3, 4, 2, 0]
    // This groups: Left attackers (←) | Center (⟷) | Right attackers (→)
    for (let visualPos = 0; visualPos < 5; visualPos++) {
      const slotIndex = this.displayOrderMap[visualPos]!;
      const slotX = startX + visualPos * (this.SLOT_SIZE + this.SLOT_SPACING);
      this.createSlotElement(slotX, y, slotIndex, visualPos);
    }
  }

  private createSlotElement(x: number, y: number, index: number, _visualPos: number): void {
    const size = this.SLOT_SIZE;

    // Container for this slot
    const slotContainer = this.scene.add.container(x, y);
    this.container.add(slotContainer);
    // Store at the slot index position, not visual position
    this.slotContainers[index] = slotContainer;

    // Get slot direction for this slot
    const direction = GAME_CONFIG.SLOT_DIRECTIONS[index] ?? SlotDirection.Right;
    const dirColors = UI_CONFIG.SLOT_DIRECTIONS.COLORS;
    const dirShortLabels = UI_CONFIG.SLOT_DIRECTIONS.SHORT_LABELS;

    // Background with direction-colored border
    const background = this.scene.add.rectangle(
      size / 2, size / 2, size, size, 0x333344, 0.9
    );
    background.setStrokeStyle(2, dirColors[direction]);
    slotContainer.add(background);
    this.slotBackgrounds[index] = background;

    // Module icon placeholder
    const icon = this.scene.add.rectangle(
      size / 2, size / 2, size - 8, size - 8, 0x666666, 0
    );
    slotContainer.add(icon);
    this.slotIcons[index] = icon;

    // Slot level text (bottom right) - smaller
    const levelText = this.scene.add.text(size - 2, size - 2, '', {
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    levelText.setOrigin(1, 1);
    slotContainer.add(levelText);
    this.slotLevelTexts[index] = levelText;

    // Lock icon (for locked slots - slots 0 and 1 are always unlocked)
    let lockIcon: Phaser.GameObjects.Text | null = null;
    if (index > 1) {
      lockIcon = this.scene.add.text(size / 2, size / 2, '🔒', {
        fontSize: '14px',
      });
      lockIcon.setOrigin(0.5, 0.5);
      lockIcon.setVisible(false);
      slotContainer.add(lockIcon);
    }
    this.slotLockIcons[index] = lockIcon;

    // Skill cooldown indicators - positioned inside slot corners
    const skill1Cooldown = this.scene.add.graphics();
    slotContainer.add(skill1Cooldown);
    this.skill1Cooldowns[index] = skill1Cooldown;

    const skill2Cooldown = this.scene.add.graphics();
    slotContainer.add(skill2Cooldown);
    this.skill2Cooldowns[index] = skill2Cooldown;

    // Skill hotkey labels - inside slot at bottom corners (compact)
    const skill1Key = this.scene.add.text(4, size - 2, `${index * 2 + 1}`, {
      fontSize: '8px',
      color: '#888888',
    });
    skill1Key.setOrigin(0, 1);
    slotContainer.add(skill1Key);
    this.skill1Keys[index] = skill1Key;

    const skill2Key = this.scene.add.text(size - 4, size - 2, `${index * 2 + 2}`, {
      fontSize: '8px',
      color: '#888888',
    });
    skill2Key.setOrigin(1, 1);
    slotContainer.add(skill2Key);
    this.skill2Keys[index] = skill2Key;

    // Slot number (top left) - smaller
    const slotNum = this.scene.add.text(2, 1, `${index + 1}`, {
      fontSize: '8px',
      color: '#666666',
    });
    slotContainer.add(slotNum);

    // Direction indicator (inside slot, top center)
    const dirIndicator = this.scene.add.text(size / 2, 2, dirShortLabels[direction], {
      fontSize: '9px',
      color: UI_CONFIG.SLOT_DIRECTIONS.HEX_COLORS[direction],
      fontStyle: 'bold',
    });
    dirIndicator.setOrigin(0.5, 0);
    slotContainer.add(dirIndicator);
    this.directionIndicators[index] = dirIndicator;

    // Auto-mode indicators - inside slot at top corners
    const skill1Auto = this.scene.add.text(4, 10, 'A', {
      fontSize: '7px',
      color: '#444444',
      fontStyle: 'bold',
    });
    skill1Auto.setOrigin(0, 0);
    skill1Auto.setVisible(false);
    slotContainer.add(skill1Auto);
    this.skill1Autos[index] = skill1Auto;

    const skill2Auto = this.scene.add.text(size - 4, 10, 'A', {
      fontSize: '7px',
      color: '#444444',
      fontStyle: 'bold',
    });
    skill2Auto.setOrigin(1, 0);
    skill2Auto.setVisible(false);
    slotContainer.add(skill2Auto);
    this.skill2Autos[index] = skill2Auto;
  }

  private createWaveProgress(): void {
    const rightX = GAME_CONFIG.WIDTH - this.PADDING;
    const y = 8;

    // Wave text - compact
    this.waveText = this.scene.add.text(rightX, y, 'Wave 1/7', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(1, 0);
    this.container.add(this.waveText);

    // Wave progress bar background - compact
    const progressWidth = 100;
    const progressHeight = 8;
    const progressX = rightX - progressWidth;
    const progressY = y + 18;

    this.waveProgressBg = this.scene.add.graphics();
    this.waveProgressBg.fillStyle(0x333333, 1);
    this.waveProgressBg.fillRoundedRect(progressX, progressY, progressWidth, progressHeight, 3);
    this.container.add(this.waveProgressBg);

    this.waveProgress = this.scene.add.graphics();
    this.container.add(this.waveProgress);

    // Enemy count text - compact
    this.enemyCountText = this.scene.add.text(rightX, progressY + progressHeight + 6, 'Enemies: 0', {
      fontSize: '10px',
      color: '#ff8888',
    });
    this.enemyCountText.setOrigin(1, 0);
    this.container.add(this.enemyCountText);
  }

  private subscribeToEvents(): void {
    // HP events
    this.eventManager.on(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.on(GameEvents.TANK_HEALED, this.onTankHealed, this);
    this.eventManager.on(GameEvents.NEAR_DEATH_ENTERED, this.onNearDeathEntered, this);
    this.eventManager.on(GameEvents.TANK_REVIVED, this.onTankRevived, this);
    this.eventManager.on(GameEvents.TANK_STAT_UPGRADED, this.onTankStatUpgraded, this);

    // Module events
    this.eventManager.on(GameEvents.MODULE_EQUIPPED, this.onModuleEquipped, this);
    this.eventManager.on(GameEvents.MODULE_UNEQUIPPED, this.onModuleUnequipped, this);
    this.eventManager.on(GameEvents.SLOT_UNLOCKED, this.onSlotUnlocked, this);
    this.eventManager.on(GameEvents.SLOT_UPGRADED, this.onSlotUpgraded, this);
    this.eventManager.on(GameEvents.SKILL_ACTIVATED, this.onSkillActivated, this);

    // Wave events
    this.eventManager.on(GameEvents.WAVE_STARTED, this.onWaveStarted, this);
    this.eventManager.on(GameEvents.WAVE_COMPLETED, this.onWaveCompleted, this);
    this.eventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
  }

  // === HP Bar Methods ===

  private updateHPBar(): void {
    const stats = this.gameState.getTankStats();
    const currentHP = stats.currentHP;
    const maxHP = stats.maxHP;
    const percent = Math.max(0, Math.min(currentHP / maxHP, 1));

    const hpBarWidth = this.getHPBarWidth();
    const hpBarY = 4;
    const startX = this.getCenteredStartX();

    this.hpBar.clear();

    // Color based on health percentage
    let color = 0x4ade80; // Green
    if (percent <= 0.2) {
      color = 0xef4444; // Red
    } else if (percent <= 0.5) {
      color = 0xfacc15; // Yellow
    }

    // Fill bar
    if (percent > 0) {
      this.hpBar.fillStyle(color, 1);
      this.hpBar.fillRoundedRect(
        startX + 2,
        hpBarY + 2,
        (hpBarWidth - 4) * percent,
        this.HP_BAR_HEIGHT - 4,
        3
      );
    }

    // Update text
    this.hpText.setText(`${this.formatNumber(currentHP)} / ${this.formatNumber(maxHP)}`);

    // Show/hide near death button
    if (percent <= 0.2 && currentHP > 0) {
      this.showNearDeathButton();
    } else {
      this.hideNearDeathButton();
    }
  }

  private showNearDeathButton(): void {
    this.nearDeathButton.setVisible(true);

    // Pulsing animation
    if (!this.scene.tweens.isTweening(this.nearDeathButton)) {
      this.scene.tweens.add({
        targets: this.nearDeathButton,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 1.05 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private hideNearDeathButton(): void {
    this.nearDeathButton.setVisible(false);
    this.scene.tweens.killTweensOf(this.nearDeathButton);
    this.nearDeathButton.setScale(1);
  }

  // === Module Slot Methods ===

  private updateAllSlots(): void {
    const slots = this.moduleManager.getSlots();
    for (let i = 0; i < slots.length; i++) {
      this.updateSlot(i, slots[i]!);
    }
  }

  private updateSlot(index: number, slot: ModuleSlot): void {
    const background = this.slotBackgrounds[index];
    const icon = this.slotIcons[index];
    const levelText = this.slotLevelTexts[index];
    const lockIcon = this.slotLockIcons[index];
    const skill1Key = this.skill1Keys[index];
    const skill2Key = this.skill2Keys[index];

    if (!background || !icon || !levelText || !skill1Key || !skill2Key) return;

    const isUnlocked = slot.isUnlocked();
    const equipped = slot.getEquipped();

    // Get direction color for this slot
    const direction = GAME_CONFIG.SLOT_DIRECTIONS[index] ?? SlotDirection.Right;
    const dirColor = UI_CONFIG.SLOT_DIRECTIONS.COLORS[direction];

    // Update lock state
    if (lockIcon) {
      lockIcon.setVisible(!isUnlocked);
    }

    if (!isUnlocked) {
      background.setFillStyle(0x222222, 0.9);
      background.setStrokeStyle(2, 0x444444);
      icon.setFillStyle(0x000000, 0);
      levelText.setText('');
      skill1Key.setVisible(false);
      skill2Key.setVisible(false);
    } else if (equipped) {
      const rarityColor = this.RARITY_COLORS[equipped.rarity] ?? 0x4ade80;
      const moduleColor = this.MODULE_COLORS[equipped.type] ?? 0xffffff;

      background.setFillStyle(0x333344, 0.9);
      // Use rarity color for border when equipped, but keep direction color as subtle outer glow
      background.setStrokeStyle(3, rarityColor);
      icon.setFillStyle(moduleColor, 1);
      // Show total stat levels (damage + attackSpeed + CDR)
      const stats = slot.getStats();
      const totalLevel = stats.damageLevel + stats.attackSpeedLevel + stats.cdrLevel;
      levelText.setText(`L${totalLevel}`);
      skill1Key.setVisible(true);
      skill2Key.setVisible(true);
    } else {
      background.setFillStyle(0x333344, 0.9);
      // Use direction color for empty unlocked slots
      background.setStrokeStyle(2, dirColor);
      icon.setFillStyle(0x000000, 0);
      // Show total stat levels
      const stats = slot.getStats();
      const totalLevel = stats.damageLevel + stats.attackSpeedLevel + stats.cdrLevel;
      levelText.setText(`L${totalLevel}`);
      skill1Key.setVisible(false);
      skill2Key.setVisible(false);
    }
  }

  private drawCooldownIndicator(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    module: BaseModule,
    skillIndex: number
  ): void {
    graphics.clear();

    const skillState = module.getSkillState(skillIndex);
    if (!skillState) return;

    const radius = this.SKILL_INDICATOR_SIZE / 2;
    const isReady = skillState.currentCooldown <= 0;
    const isActive = skillState.isActive;

    // Background circle
    if (isActive) {
      graphics.fillStyle(0x00ff00, 0.3);
    } else if (isReady) {
      graphics.fillStyle(0xffd700, 0.5);
    } else {
      graphics.fillStyle(0x444444, 0.5);
    }
    graphics.fillCircle(x, y, radius);

    // Cooldown arc
    if (!isReady) {
      const cooldownPercent = skillState.currentCooldown / (skillState.skill.cooldown * 1000);
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (1 - cooldownPercent) * Math.PI * 2;

      graphics.lineStyle(3, 0x00aaff, 1);
      graphics.beginPath();
      graphics.arc(x, y, radius - 2, startAngle, endAngle);
      graphics.strokePath();
    }

    // Ready indicator
    if (isReady) {
      graphics.lineStyle(2, 0xffd700, 1);
      graphics.strokeCircle(x, y, radius);
    }
  }

  // === Wave Progress Methods ===

  private updateWaveProgress(): void {
    this.waveText.setText(`Wave ${this.currentWave}/${GAME_CONFIG.WAVES_PER_ZONE}`);

    const progressWidth = 100;
    const progressHeight = 8;
    const progressX = GAME_CONFIG.WIDTH - this.PADDING - progressWidth;
    const progressY = 8 + 18; // y + 18 from createWaveProgress

    this.waveProgress.clear();

    if (this.totalEnemies > 0) {
      const killPercent = 1 - (this.remainingEnemies / this.totalEnemies);
      if (killPercent > 0) {
        this.waveProgress.fillStyle(0x4ade80, 1);
        this.waveProgress.fillRoundedRect(
          progressX + 2,
          progressY + 2,
          (progressWidth - 4) * killPercent,
          progressHeight - 4,
          2
        );
      }
    }
  }

  public updateEnemyCount(remaining: number): void {
    this.remainingEnemies = remaining;
    this.enemyCountText.setText(`Enemies: ${remaining}`);
    this.updateWaveProgress();
  }

  // === Event Handlers ===

  private onDamageTaken(): void {
    this.updateHPBar();
    // Flash effect
    this.hpBarBg.setAlpha(0.5);
    this.scene.time.delayedCall(100, () => {
      this.hpBarBg.setAlpha(1);
    });
  }

  private onTankHealed(): void {
    this.updateHPBar();
  }

  private onNearDeathEntered(): void {
    this.updateHPBar();
  }

  private onTankRevived(): void {
    this.updateHPBar();
  }

  private onTankStatUpgraded(): void {
    this.updateHPBar();
  }

  private onModuleEquipped(payload: { slotIndex: number }): void {
    const slot = this.moduleManager.getSlot(payload.slotIndex);
    if (slot) {
      this.updateSlot(payload.slotIndex, slot);
    }
  }

  private onModuleUnequipped(payload: { slotIndex: number }): void {
    const slot = this.moduleManager.getSlot(payload.slotIndex);
    if (slot) {
      this.updateSlot(payload.slotIndex, slot);
    }
  }

  private onSlotUnlocked(payload: { slotIndex: number }): void {
    const slot = this.moduleManager.getSlot(payload.slotIndex);
    if (slot) {
      this.updateSlot(payload.slotIndex, slot);
    }
  }

  private onSlotUpgraded(payload: { slotIndex: number }): void {
    const slot = this.moduleManager.getSlot(payload.slotIndex);
    if (slot) {
      this.updateSlot(payload.slotIndex, slot);

      // Flash effect
      const bg = this.slotBackgrounds[payload.slotIndex];
      if (bg) {
        this.scene.tweens.add({
          targets: bg,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
        });
      }
    }
  }

  private onSkillActivated(payload: { slotIndex: number; skillName: string }): void {
    const module = this.moduleManager.getActiveModule(payload.slotIndex);
    if (!module) return;

    const skill0 = module.getSkillState(0);
    const isSkill1 = skill0?.skill.name === payload.skillName;

    const indicator = isSkill1
      ? this.skill1Cooldowns[payload.slotIndex]
      : this.skill2Cooldowns[payload.slotIndex];

    if (indicator) {
      this.scene.tweens.add({
        targets: indicator,
        alpha: { from: 1, to: 0.3 },
        duration: 100,
        yoyo: true,
      });
    }
  }

  private onWaveStarted(payload: { waveNumber: number; enemyCount: number }): void {
    this.currentWave = payload.waveNumber;
    this.totalEnemies = payload.enemyCount;
    this.remainingEnemies = payload.enemyCount;
    this.updateWaveProgress();
    this.enemyCountText.setText(`Enemies: ${payload.enemyCount}`);
  }

  private onWaveCompleted(): void {
    this.waveText.setText('Wave Complete!');
    this.waveText.setColor('#00ff00');

    this.scene.time.delayedCall(1500, () => {
      this.waveText.setColor('#ffff00');
      this.updateWaveProgress();
    });
  }

  private onEnemyDied(): void {
    // Enemy count is updated via updateEnemyCount from GameScene
  }

  // === Update Loop ===

  public update(_time: number, _delta: number): void {
    // Update skill cooldown displays
    for (let i = 0; i < 5; i++) {
      const activeModule = this.moduleManager.getActiveModule(i);
      const skill1Cooldown = this.skill1Cooldowns[i];
      const skill2Cooldown = this.skill2Cooldowns[i];
      const skill1Auto = this.skill1Autos[i];
      const skill2Auto = this.skill2Autos[i];

      if (!activeModule) {
        skill1Cooldown?.clear();
        skill2Cooldown?.clear();
        skill1Auto?.setVisible(false);
        skill2Auto?.setVisible(false);
        continue;
      }

      // Update skill 1 cooldown - positioned at bottom left inside slot
      if (skill1Cooldown) {
        this.drawCooldownIndicator(
          skill1Cooldown,
          this.SKILL_INDICATOR_SIZE / 2 + 2,
          this.SLOT_SIZE - this.SKILL_INDICATOR_SIZE / 2 - 2,
          activeModule,
          0
        );
      }

      // Update skill 2 cooldown - positioned at bottom right inside slot
      if (skill2Cooldown) {
        this.drawCooldownIndicator(
          skill2Cooldown,
          this.SLOT_SIZE - this.SKILL_INDICATOR_SIZE / 2 - 2,
          this.SLOT_SIZE - this.SKILL_INDICATOR_SIZE / 2 - 2,
          activeModule,
          1
        );
      }

      // Update auto-mode indicators
      const skill1AutoEnabled = activeModule.isAutoModeEnabled(0);
      const skill2AutoEnabled = activeModule.isAutoModeEnabled(1);

      if (skill1Auto) {
        skill1Auto.setVisible(true);
        skill1Auto.setColor(skill1AutoEnabled ? '#00ff00' : '#444444');
        skill1Auto.setAlpha(skill1AutoEnabled ? 1 : 0.5);
      }

      if (skill2Auto) {
        skill2Auto.setVisible(true);
        skill2Auto.setColor(skill2AutoEnabled ? '#00ff00' : '#444444');
        skill2Auto.setAlpha(skill2AutoEnabled ? 1 : 0.5);
      }
    }
  }

  private updateAll(): void {
    this.updateHPBar();
    this.updateAllSlots();
    this.updateWaveProgress();
  }

  private formatNumber(num: number): string {
    const rounded = Math.floor(num);
    if (rounded >= 1_000_000) {
      return (rounded / 1_000_000).toFixed(1) + 'M';
    } else if (rounded >= 1_000) {
      return (rounded / 1_000).toFixed(1) + 'K';
    }
    return rounded.toString();
  }

  public getHeight(): number {
    return this.HEIGHT;
  }

  public destroy(): void {
    // HP events
    this.eventManager.off(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.off(GameEvents.TANK_HEALED, this.onTankHealed, this);
    this.eventManager.off(GameEvents.NEAR_DEATH_ENTERED, this.onNearDeathEntered, this);
    this.eventManager.off(GameEvents.TANK_REVIVED, this.onTankRevived, this);
    this.eventManager.off(GameEvents.TANK_STAT_UPGRADED, this.onTankStatUpgraded, this);

    // Module events
    this.eventManager.off(GameEvents.MODULE_EQUIPPED, this.onModuleEquipped, this);
    this.eventManager.off(GameEvents.MODULE_UNEQUIPPED, this.onModuleUnequipped, this);
    this.eventManager.off(GameEvents.SLOT_UNLOCKED, this.onSlotUnlocked, this);
    this.eventManager.off(GameEvents.SLOT_UPGRADED, this.onSlotUpgraded, this);
    this.eventManager.off(GameEvents.SKILL_ACTIVATED, this.onSkillActivated, this);

    // Wave events
    this.eventManager.off(GameEvents.WAVE_STARTED, this.onWaveStarted, this);
    this.eventManager.off(GameEvents.WAVE_COMPLETED, this.onWaveCompleted, this);
    this.eventManager.off(GameEvents.ENEMY_DIED, this.onEnemyDied, this);

    this.scene.tweens.killTweensOf(this.nearDeathButton);
    this.container.destroy(true);
  }
}
