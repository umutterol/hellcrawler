# Hellcrawler - GitHub Issues to Create

> **Quick Create:** Copy each issue block and paste into GitHub's "New Issue" form.
> **Bulk Create:** Use GitHub CLI with the commands at the bottom of this document.

---

## Issue Summary

| # | Title | Type | Priority | Labels |
|---|-------|------|----------|--------|
| 1 | Remove tank healthbar nameplate | Bug | Low | `bug`, `ui` |
| 2 | Fix tank shadow/visual artifact | Bug | Medium | `bug`, `visual` |
| 3 | UI skill slots not working correctly | Bug | High | `bug`, `ui` |
| 4 | Tank stat upgrade should be 7% per level | Bug | High | `bug`, `balance` |
| 5 | Near Death recharge not working | Bug | Critical | `bug`, `gameplay` |
| 6 | Some stats not working (regen, etc.) | Bug | High | `bug`, `gameplay` |
| 7 | First assigned module acts as Machine Gun instead of actual type | Bug | High | `bug`, `modules` |
| 8 | FPS/Performance issues | Bug | High | `bug`, `performance` |
| 9 | Options panel scrolls are broken | Bug | Medium | `bug`, `ui` |
| 10 | Adjust module slot firing positions | Enhancement | Medium | `enhancement`, `ui` |
| 11 | Tinker with module ranges/balance | Enhancement | Medium | `enhancement`, `balance` |
| 12 | Add enemy knockback on hit | Feature | Medium | `enhancement`, `gameplay` |
| 13 | Add bigger knockback on critical hits | Feature | Medium | `enhancement`, `gameplay` |
| 14 | Improve save system (local save issues) | Enhancement | Medium | `enhancement`, `save-system` |
| 15 | Add background parallax scrolling | Enhancement | Low | `enhancement`, `visual` |
| 16 | Expand to 10 module slots (from 5) | Feature | High | `enhancement`, `major-change` |
| 17 | Add Debug mode toggle | Dev Tools | Medium | `developer-tools` |
| 18 | Add Developer cheats/tools | Dev Tools | Medium | `developer-tools` |

---

## BUGS (9 Issues)

---

### Issue #1: Remove tank healthbar nameplate

**Labels:** `bug`, `ui`

#### Description
Remove the healthbar nameplate displayed above the tank.

#### Current Behavior
Tank has a healthbar nameplate visible above it.

#### Expected Behavior
Tank should not display a healthbar nameplate. Health is already shown in the BottomBar HUD.

#### Priority
Low - Cosmetic cleanup

---

### Issue #2: Fix tank shadow/visual artifact

**Labels:** `bug`, `visual`

#### Description
There is a shadowy visual artifact appearing on or around the tank sprite.

#### Current Behavior
Tank displays an unwanted shadow or visual artifact that shouldn't be there.

#### Expected Behavior
Tank should render cleanly without unwanted shadows or artifacts.

#### Investigation Areas
- Check tank sprite sheet for artifacts
- Review sprite scaling/rendering
- Check for duplicate sprites or layering issues

#### Priority
Medium

---

### Issue #3: UI skill slots not working correctly

**Labels:** `bug`, `ui`

#### Description
The skill slots in the UI (BottomBar) are not functioning as expected.

#### Current Behavior
UI skill slots have display or interaction issues.

#### Expected Behavior
- Skill slots should display equipped module icons
- Cooldown indicators should update correctly
- Auto-mode indicators should toggle properly
- Skills should activate on button press (1-0 keys)

#### Files to Check
- `src/ui/BottomBar.ts`
- `src/ui/ModuleSlotUI.ts`
- `src/managers/InputManager.ts`

#### Priority
High - Core UI functionality

---

### Issue #4: Tank stat upgrade should be 7% per level

**Labels:** `bug`, `balance`

#### Description
Tank stat upgrades are not providing the correct percentage bonus per upgrade.

#### Current Behavior
Stat upgrades provide an incorrect percentage bonus per level.

#### Expected Behavior
Each tank stat upgrade should provide **7% bonus per level** (not the current value).

#### Changes Required
Update the stat multiplier formula:
```typescript
// Current (likely 1%)
const multiplier = 1 + (statLevel * 0.01);

// Should be (7%)
const multiplier = 1 + (statLevel * 0.07);
```

#### Files to Check
- `src/state/GameState.ts`
- `src/entities/Tank.ts`
- `src/config/GameConfig.ts`

#### Priority
High - Balance critical

---

### Issue #5: Near Death recharge not working

**Labels:** `bug`, `gameplay`

#### Description
The Near Death system's recharge/revival timer is not functioning correctly.

#### Current Behavior
When tank enters Near Death state, the automatic revival timer (60 seconds) does not count down or trigger revival.

#### Expected Behavior
Per GDD:
- Tank enters Near Death when HP reaches 0
- Attack speed reduced by 50%
- Auto-revive after 60 seconds OR manual revive button
- Full HP restored on revival

#### Files to Check
- `src/entities/Tank.ts` - `enterNearDeath()`, `revive()`, `update()` methods
- `src/ui/BottomBar.ts` - Revive button display
- Timer implementation in update loop

#### Priority
**Critical** - Core survival mechanic broken

---

### Issue #6: Some stats not working (HP Regen, others)

**Labels:** `bug`, `gameplay`

#### Description
Certain tank stats are not applying their effects correctly.

#### Confirmed Broken Stats
- [ ] HP Regeneration - Not healing over time
- [ ] Other stats TBD

#### Investigation Required
Check each stat's implementation:
1. **HP Regen** - Should heal X HP per second based on stat level
2. **Defense** - Damage reduction formula
3. **Movement Speed** - Enemy approach speed reduction

#### Expected Behavior
All stats should apply their bonuses as defined in GDD:
- HP Regen: +0.5 HP/sec per level
- Defense: +0.5% damage reduction per level
- Movement Speed: +1% enemy slow per level

#### Files to Check
- `src/entities/Tank.ts` - `update()` method for regen
- `src/systems/CombatSystem.ts` - Damage calculations
- `src/state/GameState.ts` - Stat getters

#### Priority
High - Core progression systems

---

### Issue #7: First assigned module acts as Machine Gun instead of actual type

**Labels:** `bug`, `modules`

#### Description
When a module is first assigned to a slot, it behaves as a Machine Gun regardless of its actual type.

#### Steps to Reproduce
1. Start new game or have empty module slot
2. Equip a Missile Pod (or other non-MachineGun module)
3. Observe: Module fires like Machine Gun instead of actual type

#### Current Behavior
First equipped module defaults to Machine Gun behavior regardless of `ModuleItem.type`.

#### Expected Behavior
Module should immediately behave according to its actual type (MissilePod fires missiles, RepairDrone heals, etc.).

#### Root Cause Investigation
- Check `ModuleSlot.equip()` - Is module instance created with correct type?
- Check `ModuleManager.equipModule()` - Correct factory pattern?
- Check `BaseModule` initialization

#### Files to Check
- `src/modules/ModuleSlot.ts`
- `src/managers/ModuleManager.ts`
- `src/modules/types/*.ts`

#### Priority
High - Breaks core module system

---

### Issue #8: FPS/Performance issues

**Labels:** `bug`, `performance`

#### Description
Game experiences frame rate drops and performance issues.

#### Symptoms
- FPS drops below 60
- Stuttering during combat
- Possible memory leaks over time

#### Performance Targets (from GDD)
- 60 FPS constant
- 30 enemies on screen max
- 100 projectiles on screen max
- Memory < 300MB

#### Investigation Areas
1. **Object Pooling** - Are all entities pooled?
2. **Garbage Collection** - Check for runtime allocations
3. **Render Calls** - Texture atlas usage
4. **Update Loops** - Expensive calculations per frame
5. **Physics** - Collision detection optimization

#### Previous Optimizations (Dec 27)
- Health bar split into position/redraw
- Console.log removal from overlap callback
- FlashWhite using restoreTint()

#### Profiling Steps
1. Use Chrome DevTools Performance tab
2. Check `game.loop.actualFps` in console
3. Monitor with 30 enemies spawned

#### Priority
High - User experience critical

---

### Issue #9: Options panel scrolls are broken

**Labels:** `bug`, `ui`

#### Description
The scrollable elements in the Settings/Options panel are not functioning correctly.

#### Current Behavior
Scroll controls (volume sliders, setting lists) don't respond to input or display incorrectly.

#### Expected Behavior
- Volume sliders should be draggable
- Settings should scroll if list exceeds panel height
- All interactive elements should respond to mouse/keyboard

#### Files to Check
- `src/ui/panels/SettingsPanel.ts`
- Slider/toggle component implementations

#### Priority
Medium

---

## FEATURES & ENHANCEMENTS (7 Issues)

---

### Issue #10: Adjust module slot firing positions

**Labels:** `enhancement`, `ui`

#### Description
Fine-tune the visual positions where modules fire from on the tank sprite.

#### Current Configuration
In `src/config/GameConfig.ts`:
```typescript
MODULE_SLOT_POSITIONS: [
  { x: 60, y: -70 },   // Slot 0
  { x: 45, y: -45 },   // Slot 1
  { x: 30, y: -25 },   // Slot 2
  { x: 50, y: -60 },   // Slot 3
  { x: 35, y: -35 },   // Slot 4
]
```

#### Task
- Adjust X/Y coordinates to better match tank sprite turret positions
- Test with all module types to ensure projectiles spawn correctly
- Consider visual feedback (muzzle flash alignment)

#### Priority
Medium - Visual polish

---

### Issue #11: Balance module weapon ranges

**Labels:** `enhancement`, `balance`

#### Description
Review and adjust the range values for all module weapons.

#### Current Ranges (from GDD)
| Range Tier | Distance | Modules |
|------------|----------|---------|
| Short | 200px | Flamethrower |
| Medium | 400px | Machine Gun, Laser, Tesla, EMP |
| Long | 600px | Missile Pod, Mortar, Main Cannon |
| Self | 0px | Repair Drone, Shield Generator |

#### Task
- Playtest each module at different ranges
- Adjust values for better gameplay feel
- Ensure ranges work with enemy spawn positions
- Document final values in config

#### Priority
Medium - Balance pass

---

### Issue #12: Add enemy knockback on hit

**Labels:** `enhancement`, `gameplay`

#### Description
Implement a small knockback effect when enemies are hit by projectiles.

#### Specification
- Enemies should be pushed back slightly when taking damage
- Knockback distance: ~5-10px per hit
- Should not stack infinitely (cap at reasonable push)
- Helps create visual impact and "juice"

#### Implementation
```typescript
// In Enemy.takeDamage() or CombatSystem
enemy.x += knockbackDistance * knockbackDirection;
```

#### Considerations
- Don't push enemies off screen
- Reset knockback velocity over time
- May need to pause enemy movement briefly

#### Priority
Medium - Game feel enhancement

---

### Issue #13: Add bigger knockback on critical hits

**Labels:** `enhancement`, `gameplay`

#### Description
Critical hits should cause significantly more knockback than normal hits.

#### Specification
- Normal hit: 5-10px knockback (Issue #12)
- Critical hit: 20-30px knockback
- Visual feedback: Larger impact effect
- Audio feedback: Different hit sound

#### Implementation
```typescript
const knockback = isCrit ? CRIT_KNOCKBACK : NORMAL_KNOCKBACK;
```

#### Depends On
- Issue #12 (basic knockback system)

#### Priority
Medium - Game feel enhancement

---

### Issue #14: Improve save system (local save frustrations)

**Labels:** `enhancement`, `save-system`

#### Description
The current local save system has usability issues that need addressing.

#### Current Issues
- Save only triggers on zone complete (can lose progress)
- No manual save option in gameplay?
- Unclear save feedback

#### Proposed Improvements
1. **Auto-save more frequently** - Every wave complete, not just zone
2. **Manual save button** - Already in SettingsPanel, verify it works
3. **Save indicator** - Show "Saving..." feedback
4. **Cloud save prep** - Structure for future Steam Cloud integration
5. **Multiple save slots?** - Consider for future

#### Files to Check
- `src/managers/SaveManager.ts`
- `src/ui/panels/SettingsPanel.ts`

#### Priority
Medium - Quality of life

---

### Issue #15: Add background parallax scrolling

**Labels:** `enhancement`, `visual`

#### Description
Implement parallax scrolling effect for the background to add depth and visual interest.

#### Specification
- Background layers move at different speeds
- Creates illusion of depth/movement
- Since tank is stationary, parallax creates sense of world motion
- Subtle effect, not distracting

#### Implementation Approach
1. Split background into 2-3 layers (far, mid, near)
2. Scroll layers at different speeds based on "virtual" tank movement
3. Loop seamlessly

#### Example
```typescript
// Far layer moves slowly
farBackground.x -= 0.5 * delta;

// Near layer moves faster
nearBackground.x -= 2 * delta;

// Reset when off screen
if (layer.x < -layer.width) layer.x = 0;
```

#### Priority
Low - Visual polish

---

### Issue #16: Expand to 10 module slots (from 5)

**Labels:** `enhancement`, `major-change`

#### Description
Increase the maximum number of module slots from 5 to 10.

#### Current System
- 5 slots total
- Slot 1: Free
- Slots 2-3: Purchasable early
- Slots 4-5: Endgame unlocks (Diaboros, Uber bosses)

#### Proposed System (10 Slots)
| Slot | Unlock Condition | Cost |
|------|------------------|------|
| 1 | Free | 0 |
| 2 | Available | 10,000 |
| 3 | Available | 50,000 |
| 4 | Available | 100,000 |
| 5 | Available | 250,000 |
| 6 | Beat Act 4 Boss | 500,000 |
| 7 | Beat Act 6 Boss | 750,000 |
| 8 | Beat Diaboros | 1,000,000 |
| 9 | Beat 4 Uber Bosses | 1,500,000 |
| 10 | Beat All Uber Bosses | 2,000,000 |

#### Changes Required
1. **GameConfig.ts** - Update slot costs, unlock conditions
2. **GameState.ts** - Expand slots array to 10
3. **UI/BottomBar.ts** - Redesign to fit 10 slots
4. **UI/TankStatsPanel.ts** - Add tabs for slots 6-10
5. **UI/ShopPanel.ts** - List 10 slots
6. **ModuleManager.ts** - Support 10 active modules
7. **Input system** - Keys 1-0 for 10 slots (0 = slot 10)
8. **Balance pass** - Adjust difficulty for 10-weapon builds

#### Impact
- **HIGH** - Major gameplay change
- Significantly increases build variety
- May require rebalancing enemy HP/damage
- More screen clutter with 10 modules firing

#### Priority
High - Major feature request

---

## DEVELOPER TOOLS (2 Issues)

---

### Issue #17: Add Debug mode toggle

**Labels:** `developer-tools`

#### Description
Implement a toggle to enable/disable debug information and visualizations.

#### Debug Features to Toggle
- [ ] FPS counter display
- [ ] Hitbox visualizations
- [ ] Enemy count display
- [ ] Projectile count display
- [ ] Pool status (available/used)
- [ ] Console logging verbosity
- [ ] Performance metrics

#### Implementation
```typescript
// GameConfig.ts
DEBUG_MODE: false,

// Toggle via keyboard (e.g., F12 or `)
if (key === 'F12') {
  GameConfig.DEBUG_MODE = !GameConfig.DEBUG_MODE;
}

// Conditional rendering
if (GameConfig.DEBUG_MODE) {
  this.drawHitboxes();
  this.showFPS();
}
```

#### Considerations
- Should be disabled in production builds
- Keyboard shortcut should not conflict with browser/Electron
- Persist preference in localStorage

#### Priority
Medium - Development efficiency

---

### Issue #18: Add Developer cheats/tools panel

**Labels:** `developer-tools`

#### Description
Implement a developer console or cheat panel for testing and debugging.

#### Proposed Cheats/Commands
| Command | Effect |
|---------|--------|
| `god` | Toggle invincibility |
| `gold [amount]` | Add gold (e.g., `gold 999999`) |
| `xp [amount]` | Add XP |
| `level [num]` | Set tank level |
| `spawn [enemy] [count]` | Spawn enemies |
| `killall` | Kill all enemies |
| `skipwave` | Complete current wave |
| `skipzone` | Complete current zone |
| `drop [module] [rarity]` | Force module drop |
| `unlockall` | Unlock all slots |
| `reset` | Reset save data |
| `timescale [x]` | Speed up/slow game |

#### Implementation Options
1. **Console command** - Type in browser/Electron console
2. **In-game panel** - Hidden panel (Ctrl+Shift+D)
3. **URL parameters** - `?cheats=true`

#### Security
- Strip from production builds OR
- Require activation code
- Disable achievements if cheats used

#### Example Implementation
```typescript
// Expose to window for console access
(window as any).cheat = {
  god: () => this.tank.invincible = true,
  gold: (n: number) => this.gameState.addGold(n),
  // ...
};
```

#### Priority
Medium - Speeds up testing significantly

---

## GitHub CLI Commands

If you have GitHub CLI (`gh`) installed, run these commands to create all issues:

```bash
# Create labels first
gh label create "ui" --color "1d76db" --description "User interface related"
gh label create "visual" --color "5319e7" --description "Visual/graphics related"
gh label create "gameplay" --color "0e8a16" --description "Core gameplay mechanics"
gh label create "balance" --color "fbca04" --description "Game balance related"
gh label create "performance" --color "d93f0b" --description "Performance optimization"
gh label create "modules" --color "006b75" --description "Module system related"
gh label create "save-system" --color "c2e0c6" --description "Save/load functionality"
gh label create "major-change" --color "b60205" --description "Significant feature change"
gh label create "developer-tools" --color "bfdadc" --description "Development tools and debugging"

# Then create issues (example for first one)
gh issue create --title "Bug: Remove tank healthbar nameplate" \
  --body "Remove the healthbar nameplate displayed above the tank. Health is shown in BottomBar." \
  --label "bug,ui"
```

---

## Quick Reference - Copy/Paste Titles

```
Bug: Remove tank healthbar nameplate
Bug: Fix tank shadow/visual artifact
Bug: UI skill slots not working correctly
Bug: Tank stat upgrade should be 7% per level
Bug: Near Death recharge not working
Bug: Some stats not working (HP Regen, others)
Bug: First assigned module acts as Machine Gun instead of actual type
Bug: FPS/Performance issues
Bug: Options panel scrolls are broken
Enhancement: Adjust module slot firing positions
Enhancement: Balance module weapon ranges
Feature: Add enemy knockback on hit
Feature: Add bigger knockback on critical hits
Enhancement: Improve save system (local save frustrations)
Enhancement: Add background parallax scrolling
Feature: Expand to 10 module slots (from 5)
Dev Tools: Add Debug mode toggle
Dev Tools: Add Developer cheats/tools panel
```

---

**Total Issues: 18**
- Bugs: 9
- Enhancements/Features: 7
- Developer Tools: 2

---

*Generated: December 2024*
