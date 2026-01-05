import Phaser from 'phaser';
import { ModuleManager } from '../modules/ModuleManager';
import { ModuleSlot } from '../modules/ModuleSlot';
import { BaseModule } from '../modules/BaseModule';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * UI representation of a single module slot
 */
interface SlotUIElement {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Rectangle;
  levelText: Phaser.GameObjects.Text;
  lockIcon: Phaser.GameObjects.Text | null;
  skill1Cooldown: Phaser.GameObjects.Graphics;
  skill2Cooldown: Phaser.GameObjects.Graphics;
  skill1Key: Phaser.GameObjects.Text;
  skill2Key: Phaser.GameObjects.Text;
  skill1Auto: Phaser.GameObjects.Text;
  skill2Auto: Phaser.GameObjects.Text;
}

/**
 * ModuleSlotUI - Visual representation of the 5 module slots
 *
 * Shows at the bottom of the screen:
 * - 5 slot boxes
 * - Equipped module icon and type
 * - Slot level
 * - Skill cooldowns (radial progress)
 * - Lock state for locked slots
 */
export class ModuleSlotUI {
  private scene: Phaser.Scene;
  private moduleManager: ModuleManager;
  private eventManager: EventManager;

  // Main container
  private container!: Phaser.GameObjects.Container;

  // Slot UI elements
  private slotElements: SlotUIElement[] = [];

  // Layout constants
  private static readonly SLOT_SIZE = 64;
  private static readonly SLOT_SPACING = 16;
  private static readonly BOTTOM_MARGIN = 20;
  private static readonly SKILL_INDICATOR_SIZE = 24;

  // Rarity colors
  private static readonly RARITY_COLORS: Record<string, number> = {
    uncommon: 0x00ff00,
    rare: 0x0088ff,
    epic: 0xaa00ff,
    legendary: 0xff8800,
  };

  // Module type colors (simplified)
  private static readonly MODULE_COLORS: Record<string, number> = {
    machineGun: 0xffff00,
    missilePod: 0xff4444,
    repairDrone: 0x00ff88,
    shieldGenerator: 0x00ffff,
    laserCutter: 0xff00ff,
    teslaCoil: 0x8888ff,
    flamethrower: 0xff8800,
    empEmitter: 0xffffff,
    mortar: 0x888888,
    mainCannon: 0xff6600,
  };

  constructor(scene: Phaser.Scene, moduleManager: ModuleManager) {
    this.scene = scene;
    this.moduleManager = moduleManager;
    this.eventManager = getEventManager();

    this.createUI();
    this.subscribeToEvents();
    this.updateAllSlots();
  }

  /**
   * Create the module slot UI
   */
  private createUI(): void {
    // Calculate total width of all slots
    const totalWidth =
      5 * ModuleSlotUI.SLOT_SIZE + 4 * ModuleSlotUI.SLOT_SPACING;
    const startX = (GAME_CONFIG.WIDTH - totalWidth) / 2;
    const y = GAME_CONFIG.HEIGHT - ModuleSlotUI.SLOT_SIZE - ModuleSlotUI.BOTTOM_MARGIN;

    // Create main container
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    // Create label
    const label = this.scene.add.text(
      GAME_CONFIG.WIDTH / 2,
      y - 25,
      'MODULES',
      {
        fontSize: '14px',
        color: '#888888',
        fontStyle: 'bold',
      }
    );
    label.setOrigin(0.5, 0.5);
    this.container.add(label);

    // Create 5 slot UI elements
    for (let i = 0; i < 5; i++) {
      const slotX =
        startX + i * (ModuleSlotUI.SLOT_SIZE + ModuleSlotUI.SLOT_SPACING);
      const slotElement = this.createSlotElement(slotX, y, i);
      this.slotElements.push(slotElement);
    }
  }

  /**
   * Create a single slot UI element
   */
  private createSlotElement(x: number, y: number, index: number): SlotUIElement {
    const size = ModuleSlotUI.SLOT_SIZE;

    // Container for this slot
    const slotContainer = this.scene.add.container(x, y);
    this.container.add(slotContainer);

    // Background
    const background = this.scene.add.rectangle(
      size / 2,
      size / 2,
      size,
      size,
      0x333344,
      0.9
    );
    background.setStrokeStyle(2, 0x555566);
    slotContainer.add(background);

    // Module icon (placeholder - will be colored based on module type)
    const icon = this.scene.add.rectangle(
      size / 2,
      size / 2,
      size - 16,
      size - 16,
      0x666666,
      0
    );
    slotContainer.add(icon);

    // Slot level text (bottom right)
    const levelText = this.scene.add.text(size - 4, size - 4, '', {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    levelText.setOrigin(1, 1);
    slotContainer.add(levelText);

    // Lock icon (for locked slots - slots 0 and 1 are always unlocked)
    let lockIcon: Phaser.GameObjects.Text | null = null;
    if (index > 1) {
      lockIcon = this.scene.add.text(size / 2, size / 2, '🔒', {
        fontSize: '24px',
      });
      lockIcon.setOrigin(0.5, 0.5);
      lockIcon.setVisible(false);
      slotContainer.add(lockIcon);
    }

    // Skill cooldown indicators (bottom of slot)
    const skill1Cooldown = this.scene.add.graphics();
    slotContainer.add(skill1Cooldown);

    const skill2Cooldown = this.scene.add.graphics();
    slotContainer.add(skill2Cooldown);

    // Skill hotkey labels
    const skill1Key = this.scene.add.text(
      8,
      size + 4,
      `${index * 2 + 1}`,
      {
        fontSize: '10px',
        color: '#888888',
      }
    );
    skill1Key.setOrigin(0.5, 0);
    slotContainer.add(skill1Key);

    const skill2Key = this.scene.add.text(
      size - 8,
      size + 4,
      `${index * 2 + 2}`,
      {
        fontSize: '10px',
        color: '#888888',
      }
    );
    skill2Key.setOrigin(0.5, 0);
    slotContainer.add(skill2Key);

    // Slot number (top left)
    const slotNum = this.scene.add.text(4, 4, `${index + 1}`, {
      fontSize: '10px',
      color: '#666666',
    });
    slotContainer.add(slotNum);

    // Auto-mode indicators (small "A" next to skill indicators)
    const skill1Auto = this.scene.add.text(
      8,
      size + 18,
      'A',
      {
        fontSize: '8px',
        color: '#444444',
        fontStyle: 'bold',
      }
    );
    skill1Auto.setOrigin(0.5, 0);
    skill1Auto.setVisible(false);
    slotContainer.add(skill1Auto);

    const skill2Auto = this.scene.add.text(
      size - 8,
      size + 18,
      'A',
      {
        fontSize: '8px',
        color: '#444444',
        fontStyle: 'bold',
      }
    );
    skill2Auto.setOrigin(0.5, 0);
    skill2Auto.setVisible(false);
    slotContainer.add(skill2Auto);

    return {
      container: slotContainer,
      background,
      icon,
      levelText,
      lockIcon,
      skill1Cooldown,
      skill2Cooldown,
      skill1Key,
      skill2Key,
      skill1Auto,
      skill2Auto,
    };
  }

  /**
   * Subscribe to relevant events
   */
  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.MODULE_EQUIPPED, this.onModuleEquipped, this);
    this.eventManager.on(GameEvents.MODULE_UNEQUIPPED, this.onModuleUnequipped, this);
    this.eventManager.on(GameEvents.SLOT_UNLOCKED, this.onSlotUnlocked, this);
    this.eventManager.on(GameEvents.SLOT_UPGRADED, this.onSlotUpgraded, this);
    this.eventManager.on(GameEvents.SKILL_ACTIVATED, this.onSkillActivated, this);
  }

  /**
   * Update all slots
   */
  private updateAllSlots(): void {
    const slots = this.moduleManager.getSlots();
    for (let i = 0; i < slots.length; i++) {
      this.updateSlot(i, slots[i]!);
    }
  }

  /**
   * Update a single slot's appearance
   */
  private updateSlot(index: number, slot: ModuleSlot): void {
    const element = this.slotElements[index];
    if (!element) return;

    const isUnlocked = slot.isUnlocked();
    const equipped = slot.getEquipped();

    // Update lock state
    if (element.lockIcon) {
      element.lockIcon.setVisible(!isUnlocked);
    }

    // Update background based on state
    if (!isUnlocked) {
      element.background.setFillStyle(0x222222, 0.9);
      element.background.setStrokeStyle(2, 0x444444);
      element.icon.setFillStyle(0x000000, 0);
      element.levelText.setText('');
      element.skill1Key.setVisible(false);
      element.skill2Key.setVisible(false);
    } else if (equipped) {
      // Has module equipped
      const rarityColor = ModuleSlotUI.RARITY_COLORS[equipped.rarity] ?? 0x00ff00;
      const moduleColor = ModuleSlotUI.MODULE_COLORS[equipped.type] ?? 0xffffff;

      element.background.setFillStyle(0x333344, 0.9);
      element.background.setStrokeStyle(3, rarityColor);
      element.icon.setFillStyle(moduleColor, 1);
      // Show total stat levels (damage + attackSpeed + CDR)
      const stats = slot.getStats();
      const totalLevel = stats.damageLevel + stats.attackSpeedLevel + stats.cdrLevel;
      element.levelText.setText(`L${totalLevel}`);
      element.skill1Key.setVisible(true);
      element.skill2Key.setVisible(true);
    } else {
      // Empty slot
      element.background.setFillStyle(0x333344, 0.9);
      element.background.setStrokeStyle(2, 0x555566);
      element.icon.setFillStyle(0x000000, 0);
      // Show total stat levels
      const stats = slot.getStats();
      const totalLevel = stats.damageLevel + stats.attackSpeedLevel + stats.cdrLevel;
      element.levelText.setText(`L${totalLevel}`);
      element.skill1Key.setVisible(false);
      element.skill2Key.setVisible(false);
    }
  }

  /**
   * Update skill cooldown displays
   */
  public update(_time: number, _delta: number): void {
    for (let i = 0; i < 5; i++) {
      const element = this.slotElements[i];
      const activeModule = this.moduleManager.getActiveModule(i);

      if (!element || !activeModule) {
        // Clear cooldown displays and hide auto-mode indicators
        if (element) {
          element.skill1Cooldown.clear();
          element.skill2Cooldown.clear();
          element.skill1Auto.setVisible(false);
          element.skill2Auto.setVisible(false);
        }
        continue;
      }

      // Update skill 1 cooldown
      this.drawCooldownIndicator(
        element.skill1Cooldown,
        8,
        ModuleSlotUI.SLOT_SIZE + 4,
        activeModule,
        0
      );

      // Update skill 2 cooldown
      this.drawCooldownIndicator(
        element.skill2Cooldown,
        ModuleSlotUI.SLOT_SIZE - 8,
        ModuleSlotUI.SLOT_SIZE + 4,
        activeModule,
        1
      );

      // Update auto-mode indicators
      const skill1AutoEnabled = activeModule.isAutoModeEnabled(0);
      const skill2AutoEnabled = activeModule.isAutoModeEnabled(1);

      element.skill1Auto.setVisible(true);
      element.skill1Auto.setColor(skill1AutoEnabled ? '#00ff00' : '#444444');
      element.skill1Auto.setAlpha(skill1AutoEnabled ? 1 : 0.5);

      element.skill2Auto.setVisible(true);
      element.skill2Auto.setColor(skill2AutoEnabled ? '#00ff00' : '#444444');
      element.skill2Auto.setAlpha(skill2AutoEnabled ? 1 : 0.5);
    }
  }

  /**
   * Draw a cooldown indicator for a skill
   */
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

    const radius = ModuleSlotUI.SKILL_INDICATOR_SIZE / 2;
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
      const cooldownPercent =
        skillState.currentCooldown / (skillState.skill.cooldown * 1000);
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

  // Event handlers
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
      const element = this.slotElements[payload.slotIndex];
      if (element) {
        this.scene.tweens.add({
          targets: element.background,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
        });
      }
    }
  }

  private onSkillActivated(payload: { slotIndex: number; skillName: string }): void {
    // Flash the skill indicator
    const element = this.slotElements[payload.slotIndex];
    if (!element) return;

    // Determine which skill was activated
    const module = this.moduleManager.getActiveModule(payload.slotIndex);
    if (!module) return;

    const skill0 = module.getSkillState(0);
    const isSkill1 = skill0?.skill.name === payload.skillName;

    const indicator = isSkill1
      ? element.skill1Cooldown
      : element.skill2Cooldown;

    // Flash effect
    this.scene.tweens.add({
      targets: indicator,
      alpha: { from: 1, to: 0.3 },
      duration: 100,
      yoyo: true,
    });
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.MODULE_EQUIPPED, this.onModuleEquipped, this);
    this.eventManager.off(GameEvents.MODULE_UNEQUIPPED, this.onModuleUnequipped, this);
    this.eventManager.off(GameEvents.SLOT_UNLOCKED, this.onSlotUnlocked, this);
    this.eventManager.off(GameEvents.SLOT_UPGRADED, this.onSlotUpgraded, this);
    this.eventManager.off(GameEvents.SKILL_ACTIVATED, this.onSkillActivated, this);

    this.container.destroy(true);
    this.slotElements = [];
  }
}
