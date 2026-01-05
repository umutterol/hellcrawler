/**
 * Realistic Balance Analysis
 *
 * What happens when players DON'T invest heavily in slots?
 * This simulates a new player or casual player experience.
 *
 * Run with: npx tsx scripts/balance-analysis-realistic.ts
 */

const BALANCE = {
  ACT_HP_SCALE: 1.8,
  ZONE_2_SCALE: 1.25,
  WAVE_SCALE_PER_WAVE: 0.05,
  FODDER_HP: { imp: 50 },
  SLOT_DAMAGE_PER_LEVEL: 0.05,
  SLOT_SPEED_PER_LEVEL: 0.03,
  SLOT_STAT_COST_MULTIPLIER: 50,
};

function getEnemyHP(baseHP: number, act: number, zone: number, wave: number): number {
  const actMult = Math.pow(BALANCE.ACT_HP_SCALE, act - 1);
  const zoneMult = zone === 2 ? BALANCE.ZONE_2_SCALE : 1.0;
  const waveMult = 1 + (wave - 1) * BALANCE.WAVE_SCALE_PER_WAVE;
  return Math.floor(baseHP * actMult * zoneMult * waveMult);
}

function getModuleDPS(dmgLevel: number, spdLevel: number, moduleStatBonus: number = 0): number {
  const baseDamage = 8;
  const baseFireRate = 200;
  const dmgMult = (1 + dmgLevel * BALANCE.SLOT_DAMAGE_PER_LEVEL) * (1 + moduleStatBonus);
  const spdMult = 1 + spdLevel * BALANCE.SLOT_SPEED_PER_LEVEL;
  return baseDamage * dmgMult * (1000 / (baseFireRate / spdMult));
}

function getUpgradeCost(fromLevel: number, toLevel: number): number {
  let total = 0;
  for (let level = fromLevel; level < toLevel; level++) {
    total += (level + 1) * BALANCE.SLOT_STAT_COST_MULTIPLIER;
  }
  return total;
}

console.log('='.repeat(80));
console.log('REALISTIC BALANCE ANALYSIS - What new/casual players experience');
console.log('='.repeat(80));

// Scenario 1: Player with ZERO slot upgrades (just basic modules)
console.log('\n📊 SCENARIO 1: Zero Slot Upgrades (New Player)\n');
console.log('Act | Zone | Enemy HP | Player DPS | TTK    | Status');
console.log('-'.repeat(60));

for (let act = 1; act <= 4; act++) {
  for (let zone = 1; zone <= 2; zone++) {
    const enemyHP = getEnemyHP(50, act, zone, 4);
    const totalDPS = getModuleDPS(0, 0) * 2; // Two modules, no upgrades
    const ttk = enemyHP / totalDPS;
    const status = ttk <= 4 ? '✅ OK' : ttk <= 6 ? '⚠️ SLOW' : '❌ TOO SLOW';
    console.log(`  ${act} |   ${zone}  |   ${enemyHP.toString().padStart(5)} |      ${totalDPS.toFixed(1).padStart(5)} | ${ttk.toFixed(2).padStart(5)}s | ${status}`);
  }
}

// Scenario 2: Player spends HALF of what optimal assumes
console.log('\n\n📊 SCENARIO 2: 50% of Optimal Investment\n');
console.log('Tank Lvl | Slot Dmg | Gold Spent | Player DPS | vs Optimal');
console.log('-'.repeat(65));

const checkpoints = [10, 20, 30, 50, 75, 100];
for (const level of checkpoints) {
  const optimalDmg = Math.floor(level * 0.7);
  const halfDmg = Math.floor(level * 0.35);
  const halfSpd = Math.floor(level * 0.15);

  const optimalDPS = getModuleDPS(optimalDmg, Math.floor(level * 0.3)) * 2;
  const halfDPS = getModuleDPS(halfDmg, halfSpd) * 2;
  const goldSpent = (getUpgradeCost(0, halfDmg) + getUpgradeCost(0, halfSpd)) * 2;
  const ratio = (halfDPS / optimalDPS * 100).toFixed(0);

  console.log(`    ${level.toString().padStart(3)} |     ${halfDmg.toString().padStart(3)} |   ${goldSpent.toLocaleString().padStart(8)} |     ${halfDPS.toFixed(1).padStart(6)} |     ${ratio}%`);
}

// Scenario 3: Module items comparison
console.log('\n\n📊 SCENARIO 3: Module Item Impact\n');
console.log('Comparing slot upgrades vs module item stats:\n');

const scenarios = [
  { name: 'Basic Module (no stats)', slotDmg: 0, moduleBonus: 0 },
  { name: 'Uncommon (5% dmg)', slotDmg: 0, moduleBonus: 0.05 },
  { name: 'Rare (15% dmg)', slotDmg: 0, moduleBonus: 0.15 },
  { name: 'Epic (30% dmg)', slotDmg: 0, moduleBonus: 0.30 },
  { name: 'Legendary (50% dmg)', slotDmg: 0, moduleBonus: 0.50 },
  { name: 'Slot Dmg Lvl 10', slotDmg: 10, moduleBonus: 0 },
  { name: 'Slot Dmg Lvl 25', slotDmg: 25, moduleBonus: 0 },
  { name: 'Slot Dmg Lvl 50', slotDmg: 50, moduleBonus: 0 },
];

console.log('Configuration                | Multiplier | DPS (2 mods) | Gold Cost');
console.log('-'.repeat(70));

for (const s of scenarios) {
  const mult = (1 + s.slotDmg * BALANCE.SLOT_DAMAGE_PER_LEVEL) * (1 + s.moduleBonus);
  const dps = getModuleDPS(s.slotDmg, 0, s.moduleBonus) * 2;
  const cost = getUpgradeCost(0, s.slotDmg) * 2;
  console.log(`${s.name.padEnd(28)} |     ${mult.toFixed(2).padStart(5)}x |       ${dps.toFixed(1).padStart(6)} |    ${cost.toLocaleString().padStart(8)}`);
}

// The Core Insight
console.log('\n\n' + '='.repeat(80));
console.log('🎯 KEY INSIGHT: Module Items Feel Worthless');
console.log('='.repeat(80));

console.log(`
PROBLEM BREAKDOWN:

1. LEGENDARY MODULE (+50% damage) = 1.5x multiplier
   - Cost: Rare drop from boss, hours of grinding
   - Equivalent to: Slot Damage Level 10 (1.5x)
   - Slot upgrade cost: ${getUpgradeCost(0, 10)} gold (~30 min farming)

2. SLOT LEVEL 50 = 3.5x multiplier
   - Cost: ${getUpgradeCost(0, 50).toLocaleString()} gold (~8 hours farming)
   - Value: More than 2x a LEGENDARY module

3. THE IMBALANCE:
   - Slot upgrades are ALWAYS better than module items
   - Module items should feel impactful, but they don't
   - A "Legendary" module gives the same bonus as 10 slot levels
   - But 10 slot levels costs only 2,750 gold!

SOLUTIONS:

Option A: BUFF Module Item Stats
   - Uncommon: 5-15% → 10-30%
   - Rare: 10-24% → 25-50%
   - Epic: 15-36% → 50-100%
   - Legendary: 32-60% → 100-200%

Option B: NERF Slot Scaling
   - Change SLOT_DAMAGE_PER_LEVEL from 0.05 to 0.02
   - This makes module items relatively more valuable

Option C: ADD Module-Exclusive Stats
   - Modules give unique effects slots can't provide
   - Example: "Pierce +2", "Chain Lightning", "Lifesteal"
   - Makes modules valuable for effects, not just stats

Option D: MULTIPLICATIVE Module Stats
   - Instead of additive (+50%), make it multiplicative
   - Legendary: 1.5x multiplier ON TOP of slot multiplier
   - Slot 50 (3.5x) + Legendary (1.5x) = 5.25x total
`);

// Quick comparison table
console.log('\n📊 WHAT UPGRADES FEEL MEANINGFUL?\n');
console.log('Upgrade                    | Old DPS → New DPS | Increase | Gold Cost');
console.log('-'.repeat(70));

const upgrades = [
  { name: 'Basic → Uncommon module', from: [0, 0, 0], to: [0, 0, 0.05], cost: 0 },
  { name: 'Uncommon → Rare module', from: [0, 0, 0.05], to: [0, 0, 0.15], cost: 0 },
  { name: 'Rare → Epic module', from: [0, 0, 0.15], to: [0, 0, 0.30], cost: 0 },
  { name: 'Slot Dmg 0 → 5', from: [0, 0, 0], to: [5, 0, 0], cost: getUpgradeCost(0, 5) * 2 },
  { name: 'Slot Dmg 5 → 10', from: [5, 0, 0], to: [10, 0, 0], cost: getUpgradeCost(5, 10) * 2 },
  { name: 'Slot Dmg 10 → 20', from: [10, 0, 0], to: [20, 0, 0], cost: getUpgradeCost(10, 20) * 2 },
];

for (const u of upgrades) {
  const oldDPS = getModuleDPS(u.from[0]!, u.from[1]!, u.from[2]) * 2;
  const newDPS = getModuleDPS(u.to[0]!, u.to[1]!, u.to[2]) * 2;
  const increase = ((newDPS / oldDPS - 1) * 100).toFixed(0);
  console.log(`${u.name.padEnd(26)} |    ${oldDPS.toFixed(1).padStart(5)} → ${newDPS.toFixed(1).padStart(6)} |    +${increase.padStart(3)}% |    ${u.cost.toLocaleString().padStart(8)}`);
}
