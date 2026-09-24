import { SaveData, PlanetId, InventoryItem, Equipment } from '../types.ts';

const SAVE_KEY = 'space_sandbox_adventure_v1';

export class SaveSystem {
  public static hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  public static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch (e) {
      console.error('Failed to load save from localStorage', e);
      return null;
    }
  }

  public static save(data: SaveData): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to write save to localStorage', e);
      return false;
    }
  }

  public static clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.error('Failed to clear save', e);
    }
  }

  public static createDefaultSave(startingPlanet: PlanetId = 'nova'): SaveData {
    // 24 slots inventory
    const inventory: (InventoryItem | null)[] = new Array(24).fill(null);
    // Starter items
    inventory[0] = { id: 'nano_medkit', count: 3 };
    inventory[1] = { id: 'space_cola', count: 4 };
    inventory[2] = { id: 'energy_stim', count: 2 };
    inventory[3] = { id: 'speed_tonic', count: 1 };
    inventory[4] = { id: 'copper_ore', count: 8 };
    inventory[5] = { id: 'stone', count: 16 };

    // 8 hotbar slots
    const hotbar: (InventoryItem | null)[] = new Array(8).fill(null);
    hotbar[0] = { id: 'starter_drill', count: 1 };
    hotbar[1] = { id: 'plasma_blade', count: 1 };
    hotbar[2] = { id: 'pulse_pistol', count: 1 };
    hotbar[3] = { id: 'nano_medkit', count: 2 };
    hotbar[4] = { id: 'space_cola', count: 2 };
    hotbar[5] = { id: 'block_tech_panel', count: 20 };

    const equipment: Equipment = {
      weapon: { id: 'plasma_blade', count: 1 },
      tool: { id: 'starter_drill', count: 1 },
      armor: null,
      booster: null,
    };

    return {
      version: 1,
      timestamp: Date.now(),
      planet: startingPlanet,
      player: {
        x: 42 * 32,
        y: 30 * 32,
        hp: 100,
        energy: 100,
      },
      inventory,
      hotbar,
      equipment,
      unlockedPlanets: ['nova'],
      defeatedBosses: [],
      credits: 50,
      stats: {
        blocksMined: 0,
        enemiesKilled: 0,
        bossesKilled: 0,
        planetsVisited: 1,
        timePlayedSec: 0,
      },
      modifiedTiles: {
        nova: {},
        ares: {},
        void: {},
      },
    };
  }
}
