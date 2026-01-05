// Quick comparison: Old vs New module stat impact

const SLOT_DAMAGE_PER_LEVEL = 0.05;

function getDPS(slotDmgLevel: number, moduleBonus: number): number {
  const baseDPS = 80; // 2x Machine Guns
  const slotMult = 1 + slotDmgLevel * SLOT_DAMAGE_PER_LEVEL;
  const moduleMult = 1 + moduleBonus / 100;
  return baseDPS * slotMult * moduleMult;
}

console.log('='.repeat(70));
console.log('MODULE STAT REBALANCE - Before vs After');
console.log('='.repeat(70));

console.log('\n📊 LEGENDARY MODULE IMPACT (at different slot levels)\n');
console.log('Slot Lvl | No Module | OLD Leg (15%) | NEW Leg (75%) | Improvement');
console.log('-'.repeat(70));

const slotLevels = [0, 10, 25, 50, 75, 100];
for (const slot of slotLevels) {
  const noMod = getDPS(slot, 0);
  const oldLeg = getDPS(slot, 15);
  const newLeg = getDPS(slot, 75);
  const oldBoost = ((oldLeg / noMod - 1) * 100).toFixed(0);
  const newBoost = ((newLeg / noMod - 1) * 100).toFixed(0);
  console.log(`    ${String(slot).padStart(3)} |    ${noMod.toFixed(0).padStart(5)} |        ${oldLeg.toFixed(0).padStart(5)} |        ${newLeg.toFixed(0).padStart(5)} | +${oldBoost}% -> +${newBoost}%`);
}

console.log('\n📊 RARITY PROGRESSION (at slot level 25)\n');
console.log('Rarity      | Old Range | New Range | DPS Boost (Old -> New)');
console.log('-'.repeat(60));

const rarities = [
  { name: 'Uncommon', old: [1, 5], new: [10, 20] },
  { name: 'Rare', old: [3, 8], new: [18, 32] },
  { name: 'Epic', old: [5, 12], new: [30, 50] },
  { name: 'Legendary', old: [8, 15], new: [50, 75] },
];

const slotLevel = 25;
const baseDPS = getDPS(slotLevel, 0);

for (const r of rarities) {
  const oldAvg = (r.old[0]! + r.old[1]!) / 2;
  const newAvg = (r.new[0]! + r.new[1]!) / 2;
  const oldBoost = ((getDPS(slotLevel, oldAvg) / baseDPS - 1) * 100).toFixed(0);
  const newBoost = ((getDPS(slotLevel, newAvg) / baseDPS - 1) * 100).toFixed(0);
  console.log(`${r.name.padEnd(11)} |   ${r.old[0]}-${String(r.old[1]).padEnd(2)}%  |  ${String(r.new[0]).padStart(2)}-${r.new[1]}% |       +${oldBoost.padStart(2)}%  ->  +${newBoost.padStart(2)}%`);
}

console.log('\n✅ KEY IMPROVEMENTS:');
console.log('   - Legendary now gives +75% DPS boost (was +15%)');
console.log('   - Each rarity upgrade feels meaningful (20-25% jumps)');
console.log('   - Module stats remain impactful even at high slot levels');
console.log('   - Finding a Legendary is now EXCITING, not disappointing\n');
