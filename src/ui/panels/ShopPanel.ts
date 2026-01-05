import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { getGameState, GameState } from '../../state/GameState';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents } from '../../types/GameEvents';
import { GAME_CONFIG } from '../../config/GameConfig';

/**
 * ShopPanel - Sliding panel for purchasing module slots
 *
 * Based on UISpec.md:
 * - Purchase module slots 2-5
 * - Show unlock requirements for slots 4-5
 * - Show costs and affordability
 * - Real-time updates when gold changes or slots are purchased
 */
export class ShopPanel extends SlidingPanel {
  private gameState: GameState = getGameState();
  private eventManager: EventManager = getEventManager();

  // Pagination state
  private currentPage: number = 0;
  private static readonly CARDS_PER_PAGE = 3;

  // Slot requirements (null = no requirement, string = boss requirement)
  private static readonly SLOT_REQUIREMENTS: (string | null)[] = [
    null, // Slot 1: Always unlocked
    null, // Slot 2: Gold only
    null, // Slot 3: Gold only
    'Defeat Diaboros (Act 8)', // Slot 4: Boss requirement
    'Defeat all Uber Bosses', // Slot 5: Boss requirement
  ];

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.SHOP);
    this.setTitle('SHOP');
    this.initContent();
    this.subscribeToEvents();
  }

  /**
   * Subscribe to game events for state changes
   */
  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.SLOT_UNLOCKED, this.onStateChanged, this);
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onStateChanged, this);
  }

  /**
   * Handle state changes (gold or slot unlocks)
   */
  private onStateChanged(): void {
    if (this.isOpen) {
      this.rebuildContent();
    }
  }

  /**
   * Create the panel content
   */
  protected createContent(): void {
    this.createSectionHeader();
    this.createSlotCards();

    // Calculate total content height for scrolling
    // Section header: ~40px
    // Slot cards: 3 per page × 100px + pagination ~20px = ~320-350px
    const totalContentHeight = 40 + ShopPanel.CARDS_PER_PAGE * 100 + 30; // ~370px
    this.setContentHeight(totalContentHeight);
  }

  /**
   * Rebuild content when state changes
   */
  private rebuildContent(): void {
    this.clearContent();
    this.createContent();
  }

  /**
   * Create section header
   */
  private createSectionHeader(): void {
    const sectionContainer = this.scene.add.container(16, 0);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'MODULE SLOTS', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Gold display
    const goldText = this.scene.add.text(
      this.getContentWidth(),
      0,
      `Gold: ${this.formatGold(this.gameState.getGold())}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: UI_CONFIG.COLORS.TEXT_GOLD,
        fontStyle: 'bold',
      }
    );
    goldText.setOrigin(1, 0);
    sectionContainer.add(goldText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    this.addToContent(sectionContainer);
  }

  /**
   * Create all slot cards with pagination
   * Only shows slots 2, 3, 4 (slots 0 and 1 are always free)
   */
  private createSlotCards(): void {
    const slots = this.gameState.getModuleSlots();

    // Only show purchasable slots (2, 3, 4) - slots 0 and 1 are always free
    const purchasableSlotIndices = [2, 3, 4];
    const totalPurchasable = purchasableSlotIndices.length;
    const totalPages = Math.ceil(totalPurchasable / ShopPanel.CARDS_PER_PAGE);
    const pageStartIndex = this.currentPage * ShopPanel.CARDS_PER_PAGE;
    const pageEndIndex = Math.min(pageStartIndex + ShopPanel.CARDS_PER_PAGE, totalPurchasable);

    // Create cards for current page
    for (let pageIdx = pageStartIndex; pageIdx < pageEndIndex; pageIdx++) {
      const slotIndex = purchasableSlotIndices[pageIdx];
      if (slotIndex === undefined) continue;
      const cardY = 40 + (pageIdx - pageStartIndex) * 100;
      const slot = slots[slotIndex];
      const card = this.createSlotCard(slotIndex, cardY, slot?.unlocked ?? false);
      this.addToContent(card);
    }

    // Pagination controls
    const paginationY = 40 + ShopPanel.CARDS_PER_PAGE * 100 + 10;
    this.createPaginationControls(paginationY, totalPages);
  }

  /**
   * Create pagination controls
   */
  private createPaginationControls(y: number, totalPages: number): void {
    if (totalPages <= 1) return;

    const container = this.scene.add.container(16, y);
    const contentWidth = this.getContentWidth();

    // Previous button
    const prevBtn = this.scene.add.text(0, 0, '< PREV', {
      fontSize: '12px',
      color: this.currentPage > 0 ? '#ffffff' : '#555555',
      fontStyle: 'bold',
    });
    if (this.currentPage > 0) {
      prevBtn.setInteractive({ useHandCursor: true });
      prevBtn.on('pointerdown', () => {
        this.currentPage--;
        this.rebuildContent();
      });
      prevBtn.on('pointerover', () => prevBtn.setColor('#ffd700'));
      prevBtn.on('pointerout', () => prevBtn.setColor('#ffffff'));
    }
    container.add(prevBtn);

    // Page indicator
    const pageText = this.scene.add.text(
      contentWidth / 2,
      0,
      `Page ${this.currentPage + 1} / ${totalPages}`,
      {
        fontSize: '12px',
        color: '#a0a0a0',
      }
    );
    pageText.setOrigin(0.5, 0);
    container.add(pageText);

    // Next button
    const nextBtn = this.scene.add.text(contentWidth, 0, 'NEXT >', {
      fontSize: '12px',
      color: this.currentPage < totalPages - 1 ? '#ffffff' : '#555555',
      fontStyle: 'bold',
    });
    nextBtn.setOrigin(1, 0);
    if (this.currentPage < totalPages - 1) {
      nextBtn.setInteractive({ useHandCursor: true });
      nextBtn.on('pointerdown', () => {
        this.currentPage++;
        this.rebuildContent();
      });
      nextBtn.on('pointerover', () => nextBtn.setColor('#ffd700'));
      nextBtn.on('pointerout', () => nextBtn.setColor('#ffffff'));
    }
    container.add(nextBtn);

    this.addToContent(container);
  }

  /**
   * Create a slot purchase card
   */
  private createSlotCard(
    slotIndex: number,
    y: number,
    isUnlocked: boolean
  ): Phaser.GameObjects.Container {
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
    const descText = this.scene.add.text(
      16,
      32,
      isUnlocked ? 'Module slot unlocked' : `Unlocks module slot ${slotIndex + 1}`,
      {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      }
    );
    container.add(descText);

    // Get slot info
    const cost = GAME_CONFIG.SLOT_COSTS[slotIndex] ?? 0;
    const requirement = ShopPanel.SLOT_REQUIREMENTS[slotIndex];
    const hasRequirement = requirement !== null;
    const meetsRequirement = this.checkRequirement(slotIndex);
    const canAfford = this.gameState.canAfford(cost);

    if (isUnlocked) {
      // Already owned
      this.createOwnedBadge(container, cardWidth);
    } else if (hasRequirement && !meetsRequirement) {
      // Locked with boss requirement
      this.createLockedCard(container, cardWidth, requirement!, cost);
    } else {
      // Available for purchase
      this.createPurchaseCard(container, cardWidth, slotIndex, cost, canAfford);
    }

    return container;
  }

  /**
   * Create owned badge for unlocked slots
   */
  private createOwnedBadge(
    container: Phaser.GameObjects.Container,
    cardWidth: number
  ): void {
    const ownedBadge = this.scene.add.text(cardWidth - 16, 12, 'OWNED', {
      fontSize: '12px',
      color: '#4ade80',
      fontStyle: 'bold',
    });
    ownedBadge.setOrigin(1, 0);
    container.add(ownedBadge);

    const checkmark = this.scene.add.text(16, 56, '✓ Unlocked', {
      fontSize: '14px',
      color: '#4ade80',
    });
    container.add(checkmark);
  }

  /**
   * Create locked card for slots with boss requirements
   */
  private createLockedCard(
    container: Phaser.GameObjects.Container,
    cardWidth: number,
    requirement: string,
    cost: number
  ): void {
    const lockedBadge = this.scene.add.text(cardWidth - 16, 12, 'LOCKED', {
      fontSize: '12px',
      color: '#ff6666',
      fontStyle: 'bold',
    });
    lockedBadge.setOrigin(1, 0);
    container.add(lockedBadge);

    const lockIcon = this.scene.add.text(16, 52, `🔒 ${requirement}`, {
      fontSize: '12px',
      color: '#ff6666',
    });
    container.add(lockIcon);

    const futureCost = this.scene.add.text(16, 70, `Cost: ${this.formatGold(cost)}`, {
      fontSize: '11px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    container.add(futureCost);
  }

  /**
   * Create purchase card for available slots
   */
  private createPurchaseCard(
    container: Phaser.GameObjects.Container,
    cardWidth: number,
    slotIndex: number,
    cost: number,
    canAfford: boolean
  ): void {
    const buttonWidth = 140;
    const buttonHeight = 36;
    const buttonX = cardWidth - buttonWidth - 16;
    const buttonY = 48;

    // Purchase button background
    const buttonBg = this.scene.add.rectangle(
      buttonX + buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      canAfford ? UI_CONFIG.COLORS.HEALTH_GREEN : 0x5a4a37
    );
    container.add(buttonBg);

    // Gold icon
    const goldIcon = this.scene.add.circle(buttonX + 20, buttonY, 8, 0xffd700);
    container.add(goldIcon);

    // Button text
    const buttonText = this.scene.add.text(
      buttonX + buttonWidth / 2 + 10,
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

    if (canAfford) {
      // Make button interactive
      buttonBg.setInteractive({ useHandCursor: true });

      buttonBg.on('pointerover', () => {
        buttonBg.setFillStyle(0x5bef8f); // Lighter green
      });

      buttonBg.on('pointerout', () => {
        buttonBg.setFillStyle(UI_CONFIG.COLORS.HEALTH_GREEN);
      });

      buttonBg.on('pointerdown', () => {
        buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_ACTIVE);
        this.purchaseSlot(slotIndex);
      });

      // "Click to buy" hint
      const buyHint = this.scene.add.text(16, 56, 'Click to purchase', {
        fontSize: '11px',
        color: '#4ade80',
      });
      container.add(buyHint);
    } else {
      // Show how much more gold is needed
      const goldNeeded = cost - this.gameState.getGold();
      const needMore = this.scene.add.text(
        16,
        56,
        `Need ${this.formatGold(goldNeeded)} more gold`,
        {
          fontSize: '11px',
          color: '#ff8866',
        }
      );
      container.add(needMore);
    }
  }

  /**
   * Check if boss requirement is met for a slot
   */
  private checkRequirement(slotIndex: number): boolean {
    const requirement = ShopPanel.SLOT_REQUIREMENTS[slotIndex];
    if (requirement === null) {
      return true; // No requirement
    }

    // Check based on slot index
    if (slotIndex === 3) {
      // Slot 4: Defeat Diaboros (Act 8 boss)
      return this.gameState.getBossesDefeated().includes('diaboros');
    } else if (slotIndex === 4) {
      // Slot 5: Defeat all Uber Bosses
      const ubersDefeated = this.gameState.getUbersDefeated();
      // For now, check if any uber is defeated (full list TBD)
      return ubersDefeated.length >= 8; // All 8 uber bosses
    }

    return false;
  }

  /**
   * Handle slot purchase
   */
  private purchaseSlot(slotIndex: number): void {
    const success = this.gameState.unlockSlot(slotIndex);

    if (success) {
      if (import.meta.env.DEV) {
        console.log(`[ShopPanel] Purchased slot ${slotIndex + 1}`);
      }
      // Content will be rebuilt by the event handler
    } else {
      if (import.meta.env.DEV) {
        console.warn(`[ShopPanel] Failed to purchase slot ${slotIndex + 1}`);
      }
    }
  }

  /**
   * Format gold amount for display
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
    this.rebuildContent();

    if (import.meta.env.DEV) {
      console.log('[ShopPanel] Refreshing content');
    }
  }

  /**
   * Clean up on destroy
   */
  public destroy(fromScene?: boolean): void {
    this.eventManager.off(GameEvents.SLOT_UNLOCKED, this.onStateChanged, this);
    this.eventManager.off(GameEvents.GOLD_CHANGED, this.onStateChanged, this);
    super.destroy(fromScene);
  }
}
