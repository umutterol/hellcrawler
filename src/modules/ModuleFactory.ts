import Phaser from 'phaser';
import { ModuleItemData, ModuleType, SlotStats } from '../types/ModuleTypes';
import { BaseModule } from './BaseModule';
import { MachineGunModule } from './MachineGunModule';
import { MissilePodModule } from './MissilePodModule';
import { RepairDroneModule } from './RepairDroneModule';
import { GameState } from '../state/GameState';

/**
 * Factory function to create the appropriate module instance
 * based on the ModuleItemData type
 */
export function createModule(
  scene: Phaser.Scene,
  moduleData: ModuleItemData,
  slotIndex: number,
  slotStats: SlotStats,
  gameState: GameState
): BaseModule | null {
  switch (moduleData.type) {
    case ModuleType.MachineGun:
      return new MachineGunModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.MissilePod:
      return new MissilePodModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.RepairDrone:
      return new RepairDroneModule(scene, moduleData, slotIndex, slotStats, gameState);

    // Future module types - return null for now
    case ModuleType.ShieldGenerator:
    case ModuleType.LaserCutter:
    case ModuleType.TeslaCoil:
    case ModuleType.Flamethrower:
    case ModuleType.EMPEmitter:
    case ModuleType.Mortar:
    case ModuleType.MainCannon:
      if (import.meta.env.DEV) {
        console.warn(`[ModuleFactory] Module type ${moduleData.type} not yet implemented`);
      }
      return null;

    default:
      console.error(`[ModuleFactory] Unknown module type: ${moduleData.type}`);
      return null;
  }
}
