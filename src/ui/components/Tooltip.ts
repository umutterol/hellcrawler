import Phaser from 'phaser';
import { UI_CONFIG } from '../../config/UIConfig';
import { ModuleItemData, ModuleSlotData, SlotStatType } from '../../types/ModuleTypes';
import { Rarity, StatType } from '../../types/GameTypes';
import { MODULE_SELL_VALUES } from '../../modules/ModuleItem';
import { GAME_CONFIG } from '../../config/GameConfig';

/**
 * Tooltip content types
 */
export type TooltipContent =
  | { type: 'module'; module: ModuleItemData }
  | { type: 'slot'; slot: ModuleSlotData; tankLevel: number }
  | { type: 'text'; title: string; description?: string };

/**
 * Tooltip - Displays contextual information on hover
 *
 * Supports:
 * - Module tooltips (name, rarity, stats, skills, sell value)
 * - Slot tooltips (direction, stat levels, upgrade costs)
 * - Simple text tooltips
 */
export class Tooltip extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private contentContainer: Phaser.GameObjects.Container;
  private currentWidth: number = 0;
  private currentHeight: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Create background graphics
    this.background = scene.add.graphics();
    this.add(this.background);

    // Create content container
    this.contentContainer = scene.add.container(0, 0);
    this.add(this.contentContainer);

    // Set depth above everything
    this.setDepth(UI_CONFIG.DEPTHS.MODAL + 100);

    // Start hidden
    this.setVisible(false);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Show tooltip with content at position
   */
  public show(content: TooltipContent, x: number, y: number): void {
    // Clear previous content
    this.contentContainer.removeAll(true);

    // Build content based on type
    switch (content.type) {
      case 'module':
        this.buildModuleContent(content.module);
        break;
      case 'slot':
        this.buildSlotContent(content.slot, content.tankLevel);
        break;
      case 'text':
        this.buildTextContent(content.title, content.description);
        break;
    }

    // Draw background
    this.drawBackground();

    // Position tooltip (handle screen edges)
    this.positionTooltip(x, y);

    // Show
    this.setVisible(true);
  }

  /**
   * Hide the tooltip
   */
  public hide(): void {
    this.setVisible(false);
  }

  /**
   * Build module tooltip content
   */
  private buildModuleContent(module: ModuleItemData): void {
    const padding = UI_CONFIG.TOOLTIP.PADDING;
    const lineHeight = UI_CONFIG.TOOLTIP.LINE_HEIGHT;
    const sectionSpacing = UI_CONFIG.TOOLTIP.SECTION_SPACING;
    let currentY = padding;
    let maxWidth = 0;

    // Module name with rarity color
    const rarityColor = this.getRarityColorHex(module.rarity);
    const typeName = this.formatModuleType(module.type);
    const nameText = this.scene.add.text(padding, currentY, typeName, {
      fontSize: '13px',
      color: rarityColor,
      fontStyle: 'bold',
    });
    this.contentContainer.add(nameText);
    maxWidth = Math.max(maxWidth, nameText.width);
    currentY += lineHeight;

    // Rarity label
    const rarityName = module.rarity.charAt(0).toUpperCase() + module.rarity.slice(1);
    const rarityText = this.scene.add.text(padding, currentY, rarityName, {
      fontSize: '11px',
      color: rarityColor,
    });
    this.contentContainer.add(rarityText);
    currentY += lineHeight + sectionSpacing;

    // Stats section
    if (module.stats.length > 0) {
      const statsHeader = this.scene.add.text(padding, currentY, 'Stats:', {
        fontSize: '11px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
        fontStyle: 'bold',
      });
      this.contentContainer.add(statsHeader);
      currentY += lineHeight;

      for (const stat of module.stats) {
        const statName = this.formatStatType(stat.type);
        const statValue = stat.value > 0 ? `+${stat.value}%` : `${stat.value}%`;
        const statColor = stat.value > 0 ? '#4ade80' : '#ef4444';

        const statText = this.scene.add.text(padding + 8, currentY, `${statName}: ${statValue}`, {
          fontSize: '10px',
          color: statColor,
        });
        this.contentContainer.add(statText);
        maxWidth = Math.max(maxWidth, statText.width + 8);
        currentY += lineHeight - 2;
      }
      currentY += sectionSpacing;
    }

    // Skills section
    if (module.skills && module.skills.length > 0) {
      const skillsHeader = this.scene.add.text(padding, currentY, 'Skills:', {
        fontSize: '11px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
        fontStyle: 'bold',
      });
      this.contentContainer.add(skillsHeader);
      currentY += lineHeight;

      for (const skill of module.skills) {
        // Skill name and cooldown
        const skillName = this.scene.add.text(padding + 8, currentY, skill.name, {
          fontSize: '10px',
          color: '#60a5fa',
        });
        this.contentContainer.add(skillName);

        const cooldownText = this.scene.add.text(
          padding + 8 + skillName.width + 8,
          currentY,
          `(${skill.cooldown}s)`,
          {
            fontSize: '10px',
            color: UI_CONFIG.COLORS.TEXT_SECONDARY,
          }
        );
        this.contentContainer.add(cooldownText);
        maxWidth = Math.max(maxWidth, skillName.width + cooldownText.width + 16);
        currentY += lineHeight - 2;

        // Skill description (if short enough)
        if (skill.description && skill.description.length < 50) {
          const descText = this.scene.add.text(padding + 8, currentY, skill.description, {
            fontSize: '9px',
            color: UI_CONFIG.COLORS.TEXT_SECONDARY,
            wordWrap: { width: UI_CONFIG.TOOLTIP.MAX_WIDTH - padding * 2 - 8 },
          });
          this.contentContainer.add(descText);
          maxWidth = Math.max(maxWidth, Math.min(descText.width + 8, UI_CONFIG.TOOLTIP.MAX_WIDTH - padding * 2));
          currentY += descText.height;
        }
      }
      currentY += sectionSpacing;
    }

    // Sell value
    const sellValue = MODULE_SELL_VALUES[module.rarity as Rarity] || 50;
    const sellText = this.scene.add.text(padding, currentY, `Sell: ${sellValue}g`, {
      fontSize: '10px',
      color: UI_CONFIG.COLORS.TEXT_GOLD,
    });
    this.contentContainer.add(sellText);
    maxWidth = Math.max(maxWidth, sellText.width);
    currentY += lineHeight;

    // Store dimensions
    this.currentWidth = Math.min(maxWidth + padding * 2, UI_CONFIG.TOOLTIP.MAX_WIDTH);
    this.currentHeight = currentY + padding;
  }

  /**
   * Build slot tooltip content
   */
  private buildSlotContent(slot: ModuleSlotData, tankLevel: number): void {
    const padding = UI_CONFIG.TOOLTIP.PADDING;
    const lineHeight = UI_CONFIG.TOOLTIP.LINE_HEIGHT;
    const sectionSpacing = UI_CONFIG.TOOLTIP.SECTION_SPACING;
    let currentY = padding;
    let maxWidth = 0;

    // Slot header with direction
    const direction = this.getSlotDirection(slot.index);
    const directionLabel = UI_CONFIG.SLOT_DIRECTIONS.LABELS[direction];
    const directionColor = UI_CONFIG.SLOT_DIRECTIONS.HEX_COLORS[direction];

    const slotTitle = this.scene.add.text(padding, currentY, `Slot ${slot.index + 1}`, {
      fontSize: '13px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    this.contentContainer.add(slotTitle);
    maxWidth = Math.max(maxWidth, slotTitle.width);
    currentY += lineHeight;

    // Direction indicator
    const dirText = this.scene.add.text(padding, currentY, directionLabel, {
      fontSize: '11px',
      color: directionColor,
    });
    this.contentContainer.add(dirText);
    currentY += lineHeight + sectionSpacing;

    // Unlocked status
    if (!slot.unlocked) {
      const lockCost = GAME_CONFIG.SLOT_COSTS[slot.index] || 0;
      const lockedText = this.scene.add.text(padding, currentY, `Locked - ${lockCost}g to unlock`, {
        fontSize: '10px',
        color: '#ef4444',
      });
      this.contentContainer.add(lockedText);
      maxWidth = Math.max(maxWidth, lockedText.width);
      currentY += lineHeight;
    } else {
      // Stat levels and upgrade costs
      const statHeader = this.scene.add.text(padding, currentY, 'Upgrades:', {
        fontSize: '11px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
        fontStyle: 'bold',
      });
      this.contentContainer.add(statHeader);
      currentY += lineHeight;

      const stats: { name: string; type: SlotStatType; level: number }[] = [
        { name: 'Damage', type: SlotStatType.Damage, level: slot.stats.damageLevel },
        { name: 'Attack Speed', type: SlotStatType.AttackSpeed, level: slot.stats.attackSpeedLevel },
        { name: 'CDR', type: SlotStatType.CDR, level: slot.stats.cdrLevel },
      ];

      for (const stat of stats) {
        const atCap = stat.level >= tankLevel;
        const upgradeCost = (stat.level + 1) * 50;
        const levelColor = atCap ? '#ffd700' : UI_CONFIG.COLORS.TEXT_PRIMARY;
        const costText = atCap ? '(MAX)' : `(${upgradeCost}g)`;
        const costColor = atCap ? '#ffd700' : UI_CONFIG.COLORS.TEXT_SECONDARY;

        const statLine = this.scene.add.text(
          padding + 8,
          currentY,
          `${stat.name}: Lv.${stat.level} (+${stat.level}%)`,
          {
            fontSize: '10px',
            color: levelColor,
          }
        );
        this.contentContainer.add(statLine);

        const costLabel = this.scene.add.text(
          padding + 8 + statLine.width + 8,
          currentY,
          costText,
          {
            fontSize: '10px',
            color: costColor,
          }
        );
        this.contentContainer.add(costLabel);
        maxWidth = Math.max(maxWidth, statLine.width + costLabel.width + 16);
        currentY += lineHeight - 2;
      }
      currentY += sectionSpacing;

      // Equipped module preview
      if (slot.equipped) {
        const equippedHeader = this.scene.add.text(padding, currentY, 'Equipped:', {
          fontSize: '11px',
          color: UI_CONFIG.COLORS.TEXT_SECONDARY,
          fontStyle: 'bold',
        });
        this.contentContainer.add(equippedHeader);
        currentY += lineHeight;

        const modColor = this.getRarityColorHex(slot.equipped.rarity);
        const modName = this.formatModuleType(slot.equipped.type);
        const modRarity = slot.equipped.rarity.charAt(0).toUpperCase() + slot.equipped.rarity.slice(1);

        const modText = this.scene.add.text(padding + 8, currentY, `${modRarity} ${modName}`, {
          fontSize: '10px',
          color: modColor,
        });
        this.contentContainer.add(modText);
        maxWidth = Math.max(maxWidth, modText.width + 8);
        currentY += lineHeight;
      } else {
        const emptyText = this.scene.add.text(padding, currentY, 'Empty Slot', {
          fontSize: '10px',
          color: UI_CONFIG.COLORS.TEXT_SECONDARY,
        });
        this.contentContainer.add(emptyText);
        currentY += lineHeight;
      }
    }

    // Store dimensions
    this.currentWidth = Math.min(maxWidth + padding * 2, UI_CONFIG.TOOLTIP.MAX_WIDTH);
    this.currentHeight = currentY + padding;
  }

  /**
   * Build simple text tooltip content
   */
  private buildTextContent(title: string, description?: string): void {
    const padding = UI_CONFIG.TOOLTIP.PADDING;
    const lineHeight = UI_CONFIG.TOOLTIP.LINE_HEIGHT;
    let currentY = padding;
    let maxWidth = 0;

    // Title
    const titleText = this.scene.add.text(padding, currentY, title, {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    this.contentContainer.add(titleText);
    maxWidth = Math.max(maxWidth, titleText.width);
    currentY += lineHeight;

    // Description (if provided)
    if (description) {
      const descText = this.scene.add.text(padding, currentY, description, {
        fontSize: '10px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
        wordWrap: { width: UI_CONFIG.TOOLTIP.MAX_WIDTH - padding * 2 },
      });
      this.contentContainer.add(descText);
      maxWidth = Math.max(maxWidth, Math.min(descText.width, UI_CONFIG.TOOLTIP.MAX_WIDTH - padding * 2));
      currentY += descText.height;
    }

    // Store dimensions
    this.currentWidth = Math.min(maxWidth + padding * 2, UI_CONFIG.TOOLTIP.MAX_WIDTH);
    this.currentHeight = currentY + padding;
  }

  /**
   * Draw background with border
   */
  private drawBackground(): void {
    this.background.clear();

    // Background fill
    this.background.fillStyle(UI_CONFIG.TOOLTIP.BACKGROUND, 0.95);
    this.background.fillRoundedRect(0, 0, this.currentWidth, this.currentHeight, UI_CONFIG.TOOLTIP.BORDER_RADIUS);

    // Border
    this.background.lineStyle(1, UI_CONFIG.TOOLTIP.BORDER_COLOR, 1);
    this.background.strokeRoundedRect(0, 0, this.currentWidth, this.currentHeight, UI_CONFIG.TOOLTIP.BORDER_RADIUS);
  }

  /**
   * Position tooltip, handling screen edges
   */
  private positionTooltip(x: number, y: number): void {
    const offsetX = UI_CONFIG.TOOLTIP.OFFSET_X;
    const offsetY = UI_CONFIG.TOOLTIP.OFFSET_Y;

    // Default position: below and to the right of cursor
    let tooltipX = x + offsetX;
    let tooltipY = y + offsetY;

    // Handle right edge
    if (tooltipX + this.currentWidth > UI_CONFIG.WIDTH) {
      tooltipX = x - this.currentWidth - offsetX;
    }

    // Handle bottom edge
    if (tooltipY + this.currentHeight > UI_CONFIG.HEIGHT) {
      tooltipY = y - this.currentHeight - offsetY;
    }

    // Handle left edge (shouldn't happen often)
    if (tooltipX < 0) {
      tooltipX = offsetX;
    }

    // Handle top edge
    if (tooltipY < 0) {
      tooltipY = offsetY;
    }

    this.setPosition(tooltipX, tooltipY);
  }

  /**
   * Get slot direction based on index
   */
  private getSlotDirection(index: number): 'left' | 'right' | 'both' {
    // Slots 0, 2 attack right (front)
    // Slots 1, 3 attack left (back)
    // Slot 4 attacks both (center)
    switch (index) {
      case 0:
      case 2:
        return 'right';
      case 1:
      case 3:
        return 'left';
      case 4:
        return 'both';
      default:
        return 'right';
    }
  }

  /**
   * Get rarity color as hex string
   */
  private getRarityColorHex(rarity: string): string {
    switch (rarity) {
      case Rarity.Common:
        return '#ffffff';
      case Rarity.Uncommon:
        return '#4ade80';
      case Rarity.Rare:
        return '#60a5fa';
      case Rarity.Epic:
        return '#c084fc';
      case Rarity.Legendary:
        return '#fb923c';
      default:
        return '#ffffff';
    }
  }

  /**
   * Format module type for display
   */
  private formatModuleType(type: string): string {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format stat type for display
   */
  private formatStatType(type: StatType): string {
    const names: Record<StatType, string> = {
      [StatType.Damage]: 'Damage',
      [StatType.AttackSpeed]: 'Attack Speed',
      [StatType.CritChance]: 'Crit Chance',
      [StatType.CritDamage]: 'Crit Damage',
      [StatType.CDR]: 'CDR',
      [StatType.AoE]: 'AoE',
      [StatType.Lifesteal]: 'Lifesteal',
      [StatType.Multistrike]: 'Multistrike',
      [StatType.Range]: 'Range',
      [StatType.GoldFind]: 'Gold Find',
      [StatType.XPBonus]: 'XP Bonus',
    };
    return names[type] || type;
  }

  /**
   * Destroy the tooltip
   */
  public destroy(fromScene?: boolean): void {
    this.contentContainer.removeAll(true);
    super.destroy(fromScene);
  }
}
