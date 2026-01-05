/**
 * Balance Analysis Script
 *
 * Calculates progression curves to verify balance:
 * - Enemy HP scaling by act/zone
 * - Player DPS scaling by level/upgrades
 * - Gold income vs upgrade costs
 * - TTK (time to kill) analysis
 *
 * Run with: npx tsx scripts/balance-analysis.ts
 */

// ===========================================
// CONSTANTS (from GameConfig.ts / BalanceGuide.md)
// ===========================================

const BALANCE = {
  // Enemy HP scaling
  ACT_HP_SCALE: 1.8,
  ZONE_2_SCALE: 1.25,
  WAVE_SCALE_PER_WAVE: 0.05,

  // Fodder base HP (Act 1, Zone 1, Wave 1)
  FODDER_HP: {
    imp: 50,
    hellhound: 40,
    possessedSoldier: 60,
    fireSkull: 35, // Currently in code (should be 300 as elite)
  },

  // Module base damage
  MODULE_BASE: {
    machineGun: { damage: 8, fireRate: 200 }, // 40 DPS base
    missilePod: { damage: 35, fireRate: 1500 }, // 23.3 DPS base
  },

  // Slot scaling
  SLOT_DAMAGE_PER_LEVEL: 0.05, // +5% per level
  SLOT_SPEED_PER_LEVEL: 0.03,  // +3% per level

  // Upgrade costs
  SLOT_STAT_COST_MULTIPLIER: 50, // Cost = (level + 1) * 50

  // Gold income estimates per hour by act
  GOLD_PER_HOUR: [1800, 2750, 4000, 5400, 8000, 10500, 14400, 18750],

  // XP per level
  XP_BASE: 100,
  XP_EXPONENT: 1.15,

  // Target progression
  TARGET_FODDER_TTK: 2, // seconds
  TARGET_ELITE_TTK: 12, // seconds
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getActMultiplier(act: number): number {
  return Math.pow(BALANCE.ACT_HP_SCALE, act - 1);
}

function getZoneMultiplier(zone: number): number {
  return zone === 2 ? BALANCE.ZONE_2_SCALE : 1.0;
}

function getWaveMultiplier(wave: number): number {
  return 1 + (wave - 1) * BALANCE.WAVE_SCALE_PER_WAVE;
}

function getEnemyHP(baseHP: number, act: number, zone: number, wave: number): number {
  return Math.floor(baseHP * getActMultiplier(act) * getZoneMultiplier(zone) * getWaveMultiplier(wave));
}

function getSlotDamageMultiplier(damageLevel: number): number {
  return 1 + damageLevel * BALANCE.SLOT_DAMAGE_PER_LEVEL;
}

function getSlotSpeedMultiplier(speedLevel: number): number {
  return 1 + speedLevel * BALANCE.SLOT_SPEED_PER_LEVEL;
}

function getModuleDPS(
  baseDamage: number,
  baseFireRate: number,
  damageLevel: number,
  speedLevel: number,
  moduleStatBonus: number = 0
): number {
  const damageMultiplier = getSlotDamageMultiplier(damageLevel) * (1 + moduleStatBonus);
  const speedMultiplier = getSlotSpeedMultiplier(speedLevel);
  const effectiveFireRate = baseFireRate / speedMultiplier;
  const shotsPerSecond = 1000 / effectiveFireRate;
  return baseDamage * damageMultiplier * shotsPerSecond;
}

function getUpgradeCost(fromLevel: number, toLevel: number): number {
  let total = 0;
  for (let level = fromLevel; level < toLevel; level++) {
    total += (level + 1) * BALANCE.SLOT_STAT_COST_MULTIPLIER;
  }
  return total;
}

function getXPForLevel(level: number): number {
  return Math.floor(BALANCE.XP_BASE * Math.pow(BALANCE.XP_EXPONENT, level - 1));
}

function getTotalXPToLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += getXPForLevel(l);
  }
  return total;
}

// ===========================================
// ANALYSIS
// ===========================================

console.log('='.repeat(80));
console.log('HELLCRAWLER BALANCE ANALYSIS');
console.log('='.repeat(80));

// 1. Enemy HP Progression
console.log('\n📊 ENEMY HP SCALING (Imp - base 50 HP)\n');
console.log('Act | Zone | Wave 1 HP | Wave 7 HP | HP Multiplier');
console.log('-'.repeat(55));

for (let act = 1; act <= 8; act++) {
  for (let zone = 1; zone <= 2; zone++) {
    const wave1HP = getEnemyHP(50, act, zone, 1);
    const wave7HP = getEnemyHP(50, act, zone, 7);
    const multiplier = getActMultiplier(act) * getZoneMultiplier(zone);
    console.log(`  ${act} |   ${zone}  |    ${wave1HP.toString().padStart(5)} |    ${wave7HP.toString().padStart(5)} |     ${multiplier.toFixed(2)}x`);
  }
}

// 2. Player DPS Progression (assuming reasonable investment)
console.log('\n\n📊 PLAYER DPS PROGRESSION (2x Machine Guns, optimal slot investment)\n');
console.log('Tank Lvl | Slot Dmg | Slot Spd | Single DPS | Total DPS | Upgrade Cost');
console.log('-'.repeat(75));

const checkpoints = [1, 5, 10, 20, 30, 50, 75, 100, 160];
let previousDmgLevel = 0;

for (const tankLevel of checkpoints) {
  // Assume player invests ~70% of slot levels in damage, 30% in speed
  // Slot stats can be upgraded up to tank level
  const dmgLevel = Math.floor(tankLevel * 0.7);
  const spdLevel = Math.floor(tankLevel * 0.3);

  const singleModuleDPS = getModuleDPS(8, 200, dmgLevel, spdLevel);
  const totalDPS = singleModuleDPS * 2; // Two modules

  const dmgCost = getUpgradeCost(0, dmgLevel);
  const spdCost = getUpgradeCost(0, spdLevel);
  const totalCost = (dmgCost + spdCost) * 2; // For both slots

  console.log(`    ${tankLevel.toString().padStart(3)} |     ${dmgLevel.toString().padStart(3)} |     ${spdLevel.toString().padStart(3)} |     ${singleModuleDPS.toFixed(1).padStart(5)} |    ${totalDPS.toFixed(1).padStart(6)} |    ${totalCost.toLocaleString().padStart(10)}`);
}

// 3. TTK Analysis - Does player DPS keep up with enemy HP?
console.log('\n\n📊 TTK ANALYSIS - Fodder Kill Times (Imp)\n');
console.log('Target TTK: 2-4 seconds\n');
console.log('Act | Zone | Enemy HP | Expected Lvl | Player DPS | TTK    | Status');
console.log('-'.repeat(75));

const actToLevel: Record<number, number> = {
  1: 5, 2: 15, 3: 25, 4: 40, 5: 55, 6: 75, 7: 100, 8: 140
};

for (let act = 1; act <= 8; act++) {
  for (let zone = 1; zone <= 2; zone++) {
    const enemyHP = getEnemyHP(50, act, zone, 4); // Wave 4 as mid-point
    const expectedLevel = actToLevel[act]! + (zone - 1) * 5;

    const dmgLevel = Math.floor(expectedLevel * 0.7);
    const spdLevel = Math.floor(expectedLevel * 0.3);
    const totalDPS = getModuleDPS(8, 200, dmgLevel, spdLevel) * 2;

    const ttk = enemyHP / totalDPS;
    const status = ttk <= 4 ? '✅ OK' : ttk <= 6 ? '⚠️ SLOW' : '❌ TOO SLOW';

    console.log(`  ${act} |   ${zone}  |   ${enemyHP.toString().padStart(5)} |         ${expectedLevel.toString().padStart(3)} |     ${totalDPS.toFixed(1).padStart(5)} | ${ttk.toFixed(2).padStart(5)}s | ${status}`);
  }
}

// 4. Gold Economy Analysis
console.log('\n\n📊 GOLD ECONOMY - Upgrade Cost vs Income\n');
console.log('Tank Lvl | Total Upgrade Cost | Hours to Farm | At Act | Gold/Hour');
console.log('-'.repeat(70));

for (const tankLevel of checkpoints) {
  const dmgLevel = Math.floor(tankLevel * 0.7);
  const spdLevel = Math.floor(tankLevel * 0.3);
  const totalCost = (getUpgradeCost(0, dmgLevel) + getUpgradeCost(0, spdLevel)) * 2;

  // Estimate which act player would be at
  const estimatedAct = Math.min(8, Math.floor(tankLevel / 20) + 1);
  const goldPerHour = BALANCE.GOLD_PER_HOUR[estimatedAct - 1]!;
  const hoursToFarm = totalCost / goldPerHour;

  console.log(`    ${tankLevel.toString().padStart(3)} |        ${totalCost.toLocaleString().padStart(10)} |         ${hoursToFarm.toFixed(1).padStart(5)} |      ${estimatedAct} |     ${goldPerHour.toLocaleString()}`);
}

// 5. The Core Problem
console.log('\n\n' + '='.repeat(80));
console.log('🔴 IDENTIFIED BALANCE ISSUES');
console.log('='.repeat(80));

console.log(`
1. SLOT SCALING IS TOO WEAK FOR LATE GAME
   - At level 50: Slot damage = 1 + 50 * 0.05 = 3.5x multiplier
   - Enemy HP at Act 5: 1.8^4 = 10.5x multiplier
   - Gap: Player damage grows 3.5x, enemies grow 10.5x = player falls behind 3x

2. EXPONENTIAL VS LINEAR GROWTH MISMATCH
   - Enemy HP: Exponential (1.8^act)
   - Player damage: Linear (1 + level * 0.05)
   - This guarantees player falls behind in later acts

3. MODULE ITEM STATS ARE NEGLIGIBLE
   - Legendary module: 32-60% total stats (avg ~45%)
   - This adds ~0.45x to damage
   - Compared to enemies growing 1.8x per act, this is insignificant

4. RECOMMENDED FIX: Make slot scaling exponential to match enemy scaling
   - Option A: Change SLOT_DAMAGE_PER_LEVEL from 0.05 to compound (1.05^level)
   - Option B: Add tank-level based damage multiplier
   - Option C: Reduce enemy HP scaling from 1.8 to ~1.4-1.5
`);

// 6. Proposed Fix Simulation
console.log('\n' + '='.repeat(80));
console.log('🟢 PROPOSED FIX: Exponential Slot Scaling');
console.log('='.repeat(80));

function getExponentialDamageMultiplier(level: number): number {
  return Math.pow(1.04, level); // 4% compound per level
}

console.log('\nWith exponential scaling (1.04^level for damage):\n');
console.log('Tank Lvl | Old Mult | New Mult | Enemy Mult | TTK Ratio');
console.log('-'.repeat(60));

for (const level of [10, 25, 50, 75, 100, 160]) {
  const oldMult = getSlotDamageMultiplier(Math.floor(level * 0.7));
  const newMult = getExponentialDamageMultiplier(Math.floor(level * 0.7));

  // Estimate enemy multiplier at this point
  const estimatedAct = Math.min(8, Math.floor(level / 20) + 1);
  const enemyMult = getActMultiplier(estimatedAct);

  const oldTTKRatio = enemyMult / oldMult;
  const newTTKRatio = enemyMult / newMult;

  console.log(`    ${level.toString().padStart(3)} |   ${oldMult.toFixed(2).padStart(5)} |   ${newMult.toFixed(2).padStart(5)} |     ${enemyMult.toFixed(2).padStart(5)} | ${oldTTKRatio.toFixed(2)} → ${newTTKRatio.toFixed(2)}`);
}

console.log(`
INTERPRETATION:
- TTK Ratio = Enemy HP Multiplier / Player Damage Multiplier
- Ratio of 1.0 means TTK stays constant throughout the game
- Current system: Ratio grows from 1.0 to 8+  (TTK gets 8x worse)
- Proposed fix: Ratio stays near 1.0-2.0     (TTK stays consistent)
`);
