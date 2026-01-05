import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Unit tests for zone selection logic
 *
 * These tests verify zone selection behavior without Phaser dependencies.
 * Tests the core logic: zone unlock checking, zone progression, and zone changing.
 */

// Game config values (matches GameConfig.ts)
const GAME_CONFIG = {
  TOTAL_ACTS: 8,
  ZONES_PER_ACT: 2,
  WAVES_PER_ZONE: 7,
};

// Zone config values (matches UIConfig.ts ZONE_CONFIG)
const ZONE_CONFIG = {
  ACTS: [
    { id: 1, name: 'Ruined City', description: 'The demon invasion begins' },
    { id: 2, name: 'Forsaken Cathedral', description: 'A holy place defiled' },
    { id: 3, name: 'Military Base', description: 'Last stand of humanity' },
    { id: 4, name: 'Underground Bunker', description: 'Tunnels of horror' },
    { id: 5, name: 'Hell Outskirts', description: 'The portal opens' },
    { id: 6, name: 'Burning Hells', description: 'Infernal depths' },
    { id: 7, name: 'Chaos Realm', description: 'Reality unravels' },
    { id: 8, name: 'Throne of Diaboros', description: 'The final battle' },
  ],
  ZONES: {
    1: ['Suburbs', 'Downtown'],
    2: ['Graveyard', 'Nave'],
    3: ['Perimeter', 'Command Center'],
    4: ['Upper Tunnels', 'Deep Caverns'],
    5: ['Scorched Plains', 'Lava Fields'],
    6: ['Bone Valley', 'Soul Forge'],
    7: ['Void Rift', 'Nightmare Spire'],
    8: ['Hellgate', 'Dark Throne'],
  } as Record<number, [string, string]>,
};

// Mock game state for testing
interface MockGameState {
  currentAct: number;
  currentZone: number;
  currentWave: number;
  highestAct: number;
  highestZone: number;
}

/**
 * Check if a zone is unlocked (accessible for replay)
 */
function isZoneUnlocked(state: MockGameState, act: number, zone: number): boolean {
  // Act 1 Zone 1 is always unlocked
  if (act === 1 && zone === 1) {
    return true;
  }

  // If this act is before the highest act, all zones in it are unlocked
  if (act < state.highestAct) {
    return true;
  }

  // If this is the highest act, only zones up to highestZone are unlocked
  if (act === state.highestAct) {
    return zone <= state.highestZone;
  }

  // Acts beyond highest are locked
  return false;
}

/**
 * Check if a zone is completed (player has passed it)
 */
function isZoneCompleted(state: MockGameState, act: number, zone: number): boolean {
  if (act < state.highestAct) return true;
  if (act === state.highestAct && zone < state.highestZone) return true;
  return false;
}

/**
 * Set zone with validation
 */
function setZone(
  state: MockGameState,
  act: number,
  zone: number
): { success: boolean; state: MockGameState } {
  // Validate bounds
  if (act < 1 || act > GAME_CONFIG.TOTAL_ACTS || zone < 1 || zone > GAME_CONFIG.ZONES_PER_ACT) {
    return { success: false, state };
  }

  // Check if zone is unlocked
  if (!isZoneUnlocked(state, act, zone)) {
    return { success: false, state };
  }

  // Don't change if already at this zone
  if (state.currentAct === act && state.currentZone === zone) {
    return { success: false, state };
  }

  // Update state
  return {
    success: true,
    state: {
      ...state,
      currentAct: act,
      currentZone: zone,
      currentWave: 1, // Reset to wave 1
    },
  };
}

/**
 * Complete zone and advance progression
 */
function completeZone(state: MockGameState): MockGameState {
  let newState = { ...state };
  newState.currentWave = 1;
  newState.currentZone += 1;

  // Check if completed all zones in act
  if (newState.currentZone > GAME_CONFIG.ZONES_PER_ACT) {
    newState.currentZone = 1;
    newState.currentAct += 1;
  }

  // Update highest progress if we've reached a new zone
  const currentAhead =
    newState.currentAct > newState.highestAct ||
    (newState.currentAct === newState.highestAct && newState.currentZone > newState.highestZone);

  if (currentAhead) {
    newState.highestAct = newState.currentAct;
    newState.highestZone = newState.currentZone;
  }

  return newState;
}

describe('Zone Selection - isZoneUnlocked', () => {
  it('should always unlock Act 1 Zone 1', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 1,
      highestAct: 1,
      highestZone: 1,
    };

    expect(isZoneUnlocked(state, 1, 1)).toBe(true);
  });

  it('should unlock zones up to highestZone in highestAct', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 2,
      currentWave: 1,
      highestAct: 2,
      highestZone: 2,
    };

    // All of Act 1 should be unlocked
    expect(isZoneUnlocked(state, 1, 1)).toBe(true);
    expect(isZoneUnlocked(state, 1, 2)).toBe(true);

    // Act 2 zones up to highestZone
    expect(isZoneUnlocked(state, 2, 1)).toBe(true);
    expect(isZoneUnlocked(state, 2, 2)).toBe(true);
  });

  it('should lock zones beyond highestZone in highestAct', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 1,
      currentWave: 1,
      highestAct: 2,
      highestZone: 1,
    };

    // Act 2 Zone 2 should be locked (not yet reached)
    expect(isZoneUnlocked(state, 2, 2)).toBe(false);
  });

  it('should lock all zones in acts beyond highestAct', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 1,
      highestAct: 1,
      highestZone: 1,
    };

    expect(isZoneUnlocked(state, 2, 1)).toBe(false);
    expect(isZoneUnlocked(state, 2, 2)).toBe(false);
    expect(isZoneUnlocked(state, 3, 1)).toBe(false);
  });

  it('should unlock all zones in acts before highestAct', () => {
    const state: MockGameState = {
      currentAct: 3,
      currentZone: 1,
      currentWave: 1,
      highestAct: 3,
      highestZone: 1,
    };

    // All zones in Act 1 and 2 should be unlocked
    expect(isZoneUnlocked(state, 1, 1)).toBe(true);
    expect(isZoneUnlocked(state, 1, 2)).toBe(true);
    expect(isZoneUnlocked(state, 2, 1)).toBe(true);
    expect(isZoneUnlocked(state, 2, 2)).toBe(true);
  });
});

describe('Zone Selection - isZoneCompleted', () => {
  it('should mark zones before current as completed', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 1,
      currentWave: 1,
      highestAct: 2,
      highestZone: 1,
    };

    expect(isZoneCompleted(state, 1, 1)).toBe(true);
    expect(isZoneCompleted(state, 1, 2)).toBe(true);
  });

  it('should not mark current zone as completed', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 1,
      currentWave: 3,
      highestAct: 2,
      highestZone: 1,
    };

    expect(isZoneCompleted(state, 2, 1)).toBe(false);
  });

  it('should not mark zones after current as completed', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 1,
      currentWave: 1,
      highestAct: 2,
      highestZone: 1,
    };

    expect(isZoneCompleted(state, 2, 2)).toBe(false);
    expect(isZoneCompleted(state, 3, 1)).toBe(false);
  });
});

describe('Zone Selection - setZone', () => {
  it('should successfully change to an unlocked zone', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 2,
      currentWave: 5,
      highestAct: 2,
      highestZone: 2,
    };

    const result = setZone(state, 1, 1);

    expect(result.success).toBe(true);
    expect(result.state.currentAct).toBe(1);
    expect(result.state.currentZone).toBe(1);
    expect(result.state.currentWave).toBe(1); // Reset to wave 1
  });

  it('should fail to change to a locked zone', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 1,
      highestAct: 1,
      highestZone: 1,
    };

    const result = setZone(state, 2, 1);

    expect(result.success).toBe(false);
    expect(result.state.currentAct).toBe(1);
    expect(result.state.currentZone).toBe(1);
  });

  it('should fail if already at the same zone', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 1,
      currentWave: 3,
      highestAct: 2,
      highestZone: 1,
    };

    const result = setZone(state, 2, 1);

    expect(result.success).toBe(false);
  });

  it('should fail for invalid act number', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 1,
      highestAct: 8,
      highestZone: 2,
    };

    expect(setZone(state, 0, 1).success).toBe(false);
    expect(setZone(state, 9, 1).success).toBe(false);
    expect(setZone(state, -1, 1).success).toBe(false);
  });

  it('should fail for invalid zone number', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 1,
      highestAct: 8,
      highestZone: 2,
    };

    expect(setZone(state, 1, 0).success).toBe(false);
    expect(setZone(state, 1, 3).success).toBe(false);
    expect(setZone(state, 1, -1).success).toBe(false);
  });

  it('should reset wave to 1 when changing zones', () => {
    const state: MockGameState = {
      currentAct: 2,
      currentZone: 1,
      currentWave: 6,
      highestAct: 2,
      highestZone: 1,
    };

    const result = setZone(state, 1, 2);

    expect(result.success).toBe(true);
    expect(result.state.currentWave).toBe(1);
  });
});

describe('Zone Selection - completeZone', () => {
  it('should advance to next zone', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 7,
      highestAct: 1,
      highestZone: 1,
    };

    const newState = completeZone(state);

    expect(newState.currentAct).toBe(1);
    expect(newState.currentZone).toBe(2);
    expect(newState.currentWave).toBe(1);
  });

  it('should advance to next act when completing last zone', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 2,
      currentWave: 7,
      highestAct: 1,
      highestZone: 2,
    };

    const newState = completeZone(state);

    expect(newState.currentAct).toBe(2);
    expect(newState.currentZone).toBe(1);
    expect(newState.currentWave).toBe(1);
  });

  it('should update highest progress when advancing', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 7,
      highestAct: 1,
      highestZone: 1,
    };

    const newState = completeZone(state);

    expect(newState.highestAct).toBe(1);
    expect(newState.highestZone).toBe(2);
  });

  it('should not update highest when replaying earlier zone', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 7,
      highestAct: 3,
      highestZone: 2,
    };

    const newState = completeZone(state);

    expect(newState.highestAct).toBe(3);
    expect(newState.highestZone).toBe(2);
  });
});

describe('Zone Config - Data Structure', () => {
  it('should have 8 acts defined', () => {
    expect(ZONE_CONFIG.ACTS).toHaveLength(8);
  });

  it('should have 2 zones per act', () => {
    for (let act = 1; act <= 8; act++) {
      expect(ZONE_CONFIG.ZONES[act]).toBeDefined();
      expect(ZONE_CONFIG.ZONES[act]).toHaveLength(2);
    }
  });

  it('should have unique act names', () => {
    const names = ZONE_CONFIG.ACTS.map((a) => a.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should have correct act IDs', () => {
    ZONE_CONFIG.ACTS.forEach((act, index) => {
      expect(act.id).toBe(index + 1);
    });
  });
});

describe('Zone Selection - Edge Cases', () => {
  it('should handle going back to earlier zones', () => {
    const state: MockGameState = {
      currentAct: 5,
      currentZone: 2,
      currentWave: 4,
      highestAct: 5,
      highestZone: 2,
    };

    // Go back to Act 1 Zone 1
    const result = setZone(state, 1, 1);

    expect(result.success).toBe(true);
    expect(result.state.currentAct).toBe(1);
    expect(result.state.currentZone).toBe(1);
    // Highest should remain unchanged
    expect(result.state.highestAct).toBe(5);
    expect(result.state.highestZone).toBe(2);
  });

  it('should handle completing zones when replaying earlier content', () => {
    const state: MockGameState = {
      currentAct: 1,
      currentZone: 1,
      currentWave: 7,
      highestAct: 5,
      highestZone: 2,
    };

    const newState = completeZone(state);

    expect(newState.currentAct).toBe(1);
    expect(newState.currentZone).toBe(2);
    // Highest should remain unchanged
    expect(newState.highestAct).toBe(5);
    expect(newState.highestZone).toBe(2);
  });

  it('should properly handle max act completion', () => {
    const state: MockGameState = {
      currentAct: 8,
      currentZone: 2,
      currentWave: 7,
      highestAct: 8,
      highestZone: 2,
    };

    const newState = completeZone(state);

    // Should advance to Act 9, Zone 1 (beyond game content)
    expect(newState.currentAct).toBe(9);
    expect(newState.currentZone).toBe(1);
    expect(newState.highestAct).toBe(9);
    expect(newState.highestZone).toBe(1);
  });
});
