import Phaser from 'phaser';
import { ModuleManager } from '../modules/ModuleManager';
import { Enemy } from '../entities/Enemy';

/**
 * InputManager - Handles keyboard input for skill activation
 *
 * Hotkey mapping per GDD:
 * - Keys 1,2 -> Slot 0 skills (skill 1, skill 2)
 * - Keys 3,4 -> Slot 1 skills
 * - Keys 5,6 -> Slot 2 skills
 * - Keys 7,8 -> Slot 3 skills
 * - Keys 9,0 -> Slot 4 skills
 *
 * Formula: slotIndex = floor((keyNum - 1) / 2), skillIndex = (keyNum - 1) % 2
 */
export class InputManager {
  private scene: Phaser.Scene | null = null;

  // Skill keys (1-9, 0)
  private skillKeys: Phaser.Input.Keyboard.Key[] = [];

  // Key codes for skills 1-10 (0 key is skill 10)
  private static readonly SKILL_KEY_CODES = [
    Phaser.Input.Keyboard.KeyCodes.ONE,
    Phaser.Input.Keyboard.KeyCodes.TWO,
    Phaser.Input.Keyboard.KeyCodes.THREE,
    Phaser.Input.Keyboard.KeyCodes.FOUR,
    Phaser.Input.Keyboard.KeyCodes.FIVE,
    Phaser.Input.Keyboard.KeyCodes.SIX,
    Phaser.Input.Keyboard.KeyCodes.SEVEN,
    Phaser.Input.Keyboard.KeyCodes.EIGHT,
    Phaser.Input.Keyboard.KeyCodes.NINE,
    Phaser.Input.Keyboard.KeyCodes.ZERO,
  ];

  // TAB key for stats panel toggle
  private tabKey: Phaser.Input.Keyboard.Key | null = null;

  // SHIFT key for auto-mode toggle
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;

  // Callback for TAB press
  private onTabPress: (() => void) | null = null;

  /**
   * Initialize the input manager with a scene
   */
  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;

    if (!scene.input.keyboard) {
      console.error('[InputManager] Keyboard input not available');
      return;
    }

    // Create skill keys
    this.skillKeys = InputManager.SKILL_KEY_CODES.map((keyCode) =>
      scene.input.keyboard!.addKey(keyCode)
    );

    // Create TAB key for stats panel
    this.tabKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // Create SHIFT key for auto-mode toggle
    this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    if (import.meta.env.DEV) {
      console.log('[InputManager] Initialized with 10 skill keys (Shift+Key to toggle auto-mode)');
    }
  }

  /**
   * Set callback for TAB key press
   */
  public setTabCallback(callback: () => void): void {
    this.onTabPress = callback;
  }

  /**
   * Update - check for skill key presses
   * Call this every frame from GameScene.update()
   */
  public update(moduleManager: ModuleManager, enemies: Enemy[]): void {
    if (!this.scene || this.skillKeys.length === 0) return;

    const isShiftHeld = this.shiftKey?.isDown ?? false;

    // Check each skill key
    for (let keyNum = 1; keyNum <= 10; keyNum++) {
      const keyIndex = keyNum - 1;
      const key = this.skillKeys[keyIndex];

      if (key && Phaser.Input.Keyboard.JustDown(key)) {
        // Map key number to slot and skill index
        // Keys 1,2 -> Slot 0, Keys 3,4 -> Slot 1, etc.
        const slotIndex = Math.floor((keyNum - 1) / 2);
        const skillIndex = (keyNum - 1) % 2;

        if (isShiftHeld) {
          // Shift+Key = Toggle auto-mode for this skill
          const newState = moduleManager.toggleAutoMode(slotIndex, skillIndex);
          if (import.meta.env.DEV) {
            console.log(
              `[InputManager] Shift+${keyNum} -> Slot ${slotIndex}, Skill ${skillIndex}: Auto-mode ${newState ? 'ON' : 'OFF'}`
            );
          }
        } else {
          // Key alone = Activate skill manually
          const success = moduleManager.activateSkill(slotIndex, skillIndex, enemies);
          if (import.meta.env.DEV) {
            console.log(
              `[InputManager] Key ${keyNum} pressed -> Slot ${slotIndex}, Skill ${skillIndex}: ${success ? 'activated' : 'failed/on cooldown'}`
            );
          }
        }
      }
    }

    // Check TAB key for stats panel toggle
    if (this.tabKey && Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      if (this.onTabPress) {
        this.onTabPress();
      }
    }
  }

  /**
   * Check if a specific skill key is currently pressed
   * Useful for UI visual feedback
   */
  public isSkillKeyDown(keyNum: number): boolean {
    if (keyNum < 1 || keyNum > 10) return false;
    const key = this.skillKeys[keyNum - 1];
    return key?.isDown ?? false;
  }

  /**
   * Get the key number for a slot/skill combo
   * Returns 1-10 (0 for invalid)
   */
  public static getKeyForSkill(slotIndex: number, skillIndex: number): number {
    if (slotIndex < 0 || slotIndex > 4 || skillIndex < 0 || skillIndex > 1) {
      return 0;
    }
    return slotIndex * 2 + skillIndex + 1;
  }

  /**
   * Get slot and skill index for a key number
   */
  public static getSkillForKey(keyNum: number): { slotIndex: number; skillIndex: number } | null {
    if (keyNum < 1 || keyNum > 10) return null;
    return {
      slotIndex: Math.floor((keyNum - 1) / 2),
      skillIndex: (keyNum - 1) % 2,
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Remove keys
    if (this.scene?.input.keyboard) {
      for (const key of this.skillKeys) {
        this.scene.input.keyboard.removeKey(key);
      }
      if (this.tabKey) {
        this.scene.input.keyboard.removeKey(this.tabKey);
      }
      if (this.shiftKey) {
        this.scene.input.keyboard.removeKey(this.shiftKey);
      }
    }

    this.skillKeys = [];
    this.tabKey = null;
    this.shiftKey = null;
    this.scene = null;
    this.onTabPress = null;
  }
}
