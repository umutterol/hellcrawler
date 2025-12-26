import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { getGameState, GameState } from '../../state/GameState';

/**
 * ShopPanel - Sliding panel for purchasing module slots
 *
 * Based on UISpec.md:
 * - Purchase module slots 2-5
 * - Show unlock requirements for slots 4-5
 * - Show costs and affordability
 *
 * NOTE: This is a placeholder implementation. Full functionality
 * will be added when the shop system is complete.
 */
export class ShopPanel extends SlidingPanel {
  // Initialize before super() is called since createContent() needs this
  private gameState: GameState = getGameState();

  // Slot purchase costs (from GDD)
  private static readonly SLOT_COSTS: number[] = [0, 10000, 50000, 500000, 2000000];
  private static readonly SLOT_REQUIREMENTS: (string | null)[] = [
    null,
    null,
    null,
    'Defeat Diaboros (Act 8)',
    'Defeat all Uber Bosses',
  ];

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.SHOP);
    this.setTitle('SHOP');
    this.initContent();
  }

  /**
   * Create the panel content
   */
  protected createContent(): void {
    this.createSlotsSection();
  }

  /**
   * Create the module slots purchase section
   */
  private createSlotsSection(): void {
    const sectionContainer = this.scene.add.container(16, 0);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'MODULE SLOTS', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    this.addToContent(sectionContainer);

    // Create slot cards
    for (let i = 0; i < 5; i++) {
      const cardY = 40 + i * 100;
      const card = this.createSlotCard(i, cardY);
      this.addToContent(card);
    }
  }

  /**
   * Create a slot purchase card
   */
  private createSlotCard(slotIndex: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(16, y);
    const cardWidth = this.getContentWidth();
    const cardHeight = 88;

    // Card background
    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(0x2d2d44, 1);
    cardBg.fillRoundedRect(0, 0, cardWidth, cardHeight, 8);
    cardBg.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    cardBg.strokeRoundedRect(0, 0, cardWidth, cardHeight, 8);
    container.add(cardBg);

    // Slot title
    const titleText = this.scene.add.text(16, 12, `SLOT ${slotIndex + 1}`, {
      fontSize: '16px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    container.add(titleText);

    // Slot description
    const descText = this.scene.add.text(16, 32, `Unlocks module slot ${slotIndex + 1}`, {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    container.add(descText);

    // Check slot status
    const isUnlocked = slotIndex === 0; // Slot 1 is always unlocked
    const cost = ShopPanel.SLOT_COSTS[slotIndex] ?? 0;
    const requirement = ShopPanel.SLOT_REQUIREMENTS[slotIndex];
    const isLocked = requirement !== null && requirement !== undefined;
    const canAfford = this.gameState.canAfford(cost);

    // Status indicator
    if (isUnlocked) {
      // Already owned
      const ownedBadge = this.scene.add.text(cardWidth - 16, 12, 'OWNED', {
        fontSize: '12px',
        color: '#4ade80', // Green
        fontStyle: 'bold',
      });
      ownedBadge.setOrigin(1, 0);
      container.add(ownedBadge);

      const checkmark = this.scene.add.text(16, 56, 'Unlocked', {
        fontSize: '14px',
        color: '#a0a0a0', // Secondary
      });
      container.add(checkmark);
    } else if (isLocked) {
      // Locked with requirement
      const lockedBadge = this.scene.add.text(cardWidth - 16, 12, 'LOCKED', {
        fontSize: '12px',
        color: '#ff6666',
        fontStyle: 'bold',
      });
      lockedBadge.setOrigin(1, 0);
      container.add(lockedBadge);

      const lockIcon = this.scene.add.text(16, 56, `L ${requirement}`, {
        fontSize: '12px',
        color: '#ff6666',
      });
      container.add(lockIcon);

      const futureCost = this.scene.add.text(16, 72, `Cost: ${this.formatGold(cost)}`, {
        fontSize: '11px',
        color: '#a0a0a0', // Secondary
      });
      container.add(futureCost);
    } else {
      // Available for purchase
      const buttonWidth = 120;
      const buttonHeight = 32;
      const buttonX = cardWidth - buttonWidth - 16;
      const buttonY = 48;

      const buttonBg = this.scene.add.rectangle(
        buttonX + buttonWidth / 2,
        buttonY,
        buttonWidth,
        buttonHeight,
        canAfford ? UI_CONFIG.COLORS.HEALTH_GREEN : 0x5a4a37
      );
      buttonBg.setInteractive({ useHandCursor: canAfford });
      container.add(buttonBg);

      const goldIcon = this.scene.add.circle(buttonX + 16, buttonY, 6, 0xffd700);
      container.add(goldIcon);

      const buttonText = this.scene.add.text(
        buttonX + buttonWidth / 2 + 8,
        buttonY,
        this.formatGold(cost),
        {
          fontSize: '14px',
          color: canAfford ? '#ffffff' : '#888888',
          fontStyle: 'bold',
        }
      );
      buttonText.setOrigin(0.5);
      container.add(buttonText);

      if (!canAfford) {
        const needMore = this.scene.add.text(16, 56, `Need ${this.formatGold(cost - this.gameState.getGold())} more`, {
          fontSize: '11px',
          color: '#ff8866',
        });
        container.add(needMore);
      }
    }

    return container;
  }

  /**
   * Format gold amount
   */
  private formatGold(amount: number): string {
    if (amount >= 1_000_000) {
      return (amount / 1_000_000).toFixed(1) + 'M';
    } else if (amount >= 1_000) {
      return (amount / 1_000).toFixed(1) + 'K';
    }
    return amount.toString();
  }

  /**
   * Refresh panel content when opened
   */
  public refresh(): void {
    // TODO: Update slot statuses and button states
    if (import.meta.env.DEV) {
      console.log('[ShopPanel] Refreshing content');
    }
  }
}
