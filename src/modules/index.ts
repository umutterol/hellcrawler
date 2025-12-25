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

// Factory
export { createModule } from './ModuleFactory';
