/**
 * Module System Exports
 *
 * Central export file for all module-related classes and functions.
 */

// Core Classes
export { ModuleSlot } from './ModuleSlot';
export { ModuleItem } from './ModuleItem';
export { BaseModule } from './BaseModule';
export { ModuleManager } from './ModuleManager';

// Module Implementations
export { MachineGunModule } from './MachineGunModule';
export { MissilePodModule } from './MissilePodModule';
export { RepairDroneModule } from './RepairDroneModule';
export { TeslaCoilModule } from './TeslaCoilModule';
export { SniperCannonModule } from './SniperCannonModule';
export { ShotgunTurretModule } from './ShotgunTurretModule';
export { FlamethrowerModule } from './FlamethrowerModule';
export { LaserBatteryModule } from './LaserBatteryModule';
export { ShieldGeneratorModule } from './ShieldGeneratorModule';
export { EMPDeviceModule } from './EMPDeviceModule';

// Factory
export { createModule } from './ModuleFactory';
