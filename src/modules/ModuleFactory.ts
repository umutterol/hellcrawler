import Phaser from 'phaser';
import { ModuleItemData, ModuleType, SlotStats } from '../types/ModuleTypes';
import { BaseModule } from './BaseModule';
import { MachineGunModule } from './MachineGunModule';
import { MissilePodModule } from './MissilePodModule';
import { RepairDroneModule } from './RepairDroneModule';
import { ShieldGeneratorModule } from './ShieldGeneratorModule';
import { TeslaCoilModule } from './TeslaCoilModule';
import { SniperCannonModule } from './SniperCannonModule';
import { ShotgunTurretModule } from './ShotgunTurretModule';
import { FlamethrowerModule } from './FlamethrowerModule';
import { LaserBatteryModule } from './LaserBatteryModule';
import { EMPDeviceModule } from './EMPDeviceModule';
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

    case ModuleType.ShieldGenerator:
      return new ShieldGeneratorModule(scene, moduleData, slotIndex, slotStats, gameState);

    case ModuleType.TeslaCoil:
      return new TeslaCoilModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.Mortar:
      return new SniperCannonModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.MainCannon:
      return new ShotgunTurretModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.Flamethrower:
      return new FlamethrowerModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.LaserCutter:
      return new LaserBatteryModule(scene, moduleData, slotIndex, slotStats);

    case ModuleType.EMPEmitter:
      return new EMPDeviceModule(scene, moduleData, slotIndex, slotStats);

    default:
      console.error(`[ModuleFactory] Unknown module type: ${moduleData.type}`);
      return null;
  }
}
