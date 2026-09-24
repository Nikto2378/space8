import { BlockType, PlanetId } from '../types.ts';

export const WORLD_WIDTH = 200; // in blocks
export const WORLD_HEIGHT = 110; // in blocks

// Seeded pseudo-random noise generator
function pseudoNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 137.5) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  // Cubic Hermite spline
  const u = fX * fX * (3.0 - 2.0 * fX);
  const v = fY * fY * (3.0 - 2.0 * fY);

  const n00 = pseudoNoise(iX, iY, seed);
  const n10 = pseudoNoise(iX + 1, iY, seed);
  const n01 = pseudoNoise(iX, iY + 1, seed);
  const n11 = pseudoNoise(iX + 1, iY + 1, seed);

  const nx0 = n00 * (1.0 - u) + n10 * u;
  const nx1 = n01 * (1.0 - u) + n11 * u;

  return nx0 * (1.0 - v) + nx1 * v;
}

export function generatePlanetWorld(planet: PlanetId): {
  tiles: Uint8Array;
  spawnX: number;
  spawnY: number;
  shipX: number;
  shipY: number;
  bossAltarX: number;
  bossAltarY: number;
} {
  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const setTile = (x: number, y: number, type: BlockType) => {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      tiles[y * WORLD_WIDTH + x] = type;
    }
  };
  const getTile = (x: number, y: number): BlockType => {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      return tiles[y * WORLD_WIDTH + x];
    }
    return BlockType.AIR;
  };

  const seed = planet === 'nova' ? 1042 : planet === 'ares' ? 2459 : 3918;

  // 1. Calculate surface heights
  const surfaceHeights: number[] = new Array(WORLD_WIDTH);
  const baseSurface = 32;

  for (let x = 0; x < WORLD_WIDTH; x++) {
    // Flatten starter zone around x=30..65
    if (x >= 28 && x <= 66) {
      surfaceHeights[x] = baseSurface;
    } else {
      const h1 = Math.sin(x * 0.05) * 6;
      const h2 = Math.sin(x * 0.12) * 3;
      const h3 = smoothNoise(x * 0.04, 0, seed) * 8 - 4;
      surfaceHeights[x] = Math.floor(baseSurface + h1 + h2 + h3);
    }
  }

  // 2. Fill basic strata
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const surf = surfaceHeights[x];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (y < surf) {
        setTile(x, y, BlockType.AIR);
      } else if (y === surf) {
        // Surface crust
        if (planet === 'nova') setTile(x, y, BlockType.GRASS);
        else if (planet === 'ares') setTile(x, y, BlockType.CRIMSON_ROCK);
        else setTile(x, y, BlockType.VOID_STONE);
      } else if (y < surf + 8) {
        // Subsurface
        if (planet === 'nova') setTile(x, y, BlockType.DIRT);
        else if (planet === 'ares') setTile(x, y, BlockType.CRIMSON_ROCK);
        else setTile(x, y, BlockType.VOID_STONE);
      } else {
        // Deep rock
        if (planet === 'nova') setTile(x, y, BlockType.STONE);
        else if (planet === 'ares') setTile(x, y, BlockType.BASALT);
        else setTile(x, y, BlockType.VOID_STONE);
      }
    }
  }

  // 3. Generate Caverns (Noise carving)
  for (let x = 5; x < WORLD_WIDTH - 5; x++) {
    const surf = surfaceHeights[x];
    for (let y = surf + 5; y < WORLD_HEIGHT - 16; y++) {
      const n1 = smoothNoise(x * 0.07, y * 0.07, seed + 10);
      const n2 = smoothNoise(x * 0.12, y * 0.12, seed + 20);
      const caveVal = n1 * 0.6 + n2 * 0.4;
      if (caveVal > 0.62) {
        setTile(x, y, BlockType.AIR);
      }
    }
  }

  // 4. Generate Ores & Rare Minerals
  for (let x = 3; x < WORLD_WIDTH - 3; x++) {
    const surf = surfaceHeights[x];
    for (let y = surf + 3; y < WORLD_HEIGHT - 12; y++) {
      if (getTile(x, y) === BlockType.AIR) continue;

      const oreVal = pseudoNoise(x, y, seed + 40);
      const depthRatio = (y - surf) / (WORLD_HEIGHT - surf);

      if (planet === 'nova') {
        if (oreVal > 0.94) {
          setTile(x, y, BlockType.COPPER_ORE);
        } else if (oreVal > 0.89 && depthRatio > 0.2) {
          setTile(x, y, BlockType.IRON_ORE);
        } else if (oreVal > 0.84 && depthRatio > 0.4) {
          setTile(x, y, BlockType.CYAN_CRYSTAL);
        }
      } else if (planet === 'ares') {
        if (oreVal > 0.93) {
          setTile(x, y, BlockType.ENERGY_MINERAL);
        } else if (oreVal > 0.87 && depthRatio > 0.25) {
          setTile(x, y, BlockType.TITANIUM_ORE);
        } else if (oreVal > 0.83 && depthRatio > 0.5) {
          setTile(x, y, BlockType.MAGMA_CORE);
        }
      } else {
        // Void planet
        if (oreVal > 0.92) {
          setTile(x, y, BlockType.VOID_CRYSTAL);
        } else if (oreVal > 0.86 && depthRatio > 0.25) {
          setTile(x, y, BlockType.ASTRITE_ORE);
        } else if (oreVal > 0.81 && depthRatio > 0.55) {
          setTile(x, y, BlockType.DARK_MATTER);
        }
      }
    }
  }

  // 5. Build Landing Pad & Spaceship
  const shipPadX = 36;
  const shipPadY = baseSurface;

  // Platform under ship
  for (let x = shipPadX - 4; x <= shipPadX + 16; x++) {
    setTile(x, shipPadY, BlockType.BASE_PLATING);
    setTile(x, shipPadY + 1, BlockType.REINFORCED_METAL);
  }

  // Clear air above landing pad
  for (let x = shipPadX - 5; x <= shipPadX + 18; x++) {
    for (let y = shipPadY - 12; y < shipPadY; y++) {
      setTile(x, y, BlockType.AIR);
    }
  }

  // Build Starter Base Outpost on Nova
  if (planet === 'nova') {
    const baseX = 48;
    const baseY = baseSurface;

    // Outpost Dome/Room
    for (let x = baseX; x <= baseX + 14; x++) {
      for (let y = baseY - 7; y < baseY; y++) {
        if (x === baseX || x === baseX + 14 || y === baseY - 7) {
          setTile(x, y, BlockType.BASE_WALL);
        } else if (y === baseY - 4 && (x === baseX + 2 || x === baseX + 3 || x === baseX + 11 || x === baseX + 12)) {
          setTile(x, y, BlockType.NANO_GLASS);
        } else if (y === baseY - 6 && (x === baseX + 7 || x === baseX + 8)) {
          setTile(x, y, BlockType.NEON_LIGHT);
        } else {
          setTile(x, y, BlockType.AIR);
        }
      }
    }
    // Doorway opening at left & right
    setTile(baseX, baseY - 1, BlockType.AIR);
    setTile(baseX, baseY - 2, BlockType.AIR);
    setTile(baseX + 14, baseY - 1, BlockType.AIR);
    setTile(baseX + 14, baseY - 2, BlockType.AIR);
  }

  // 6. Build Deep Boss Arena Dungeon at bottom
  const bossAltarX = 140;
  const bossAltarY = WORLD_HEIGHT - 8;

  // Clear large arena room
  for (let x = bossAltarX - 18; x <= bossAltarX + 18; x++) {
    for (let y = bossAltarY - 10; y <= bossAltarY + 4; y++) {
      if (
        x === bossAltarX - 18 ||
        x === bossAltarX + 18 ||
        y === bossAltarY - 10 ||
        y === bossAltarY + 4
      ) {
        setTile(
          x,
          y,
          planet === 'nova'
            ? BlockType.REINFORCED_METAL
            : planet === 'ares'
            ? BlockType.BASALT
            : BlockType.COSMIC_PANEL
        );
      } else {
        setTile(x, y, BlockType.AIR);
      }
    }
  }

  // Arena floor & lights
  for (let x = bossAltarX - 17; x <= bossAltarX + 17; x++) {
    setTile(x, bossAltarY + 1, BlockType.BASE_PLATING);
    if (x === bossAltarX - 12 || x === bossAltarX + 12 || x === bossAltarX) {
      setTile(x, bossAltarY - 9, BlockType.NEON_LIGHT);
    }
  }

  // Vertical shaft/entry to arena
  for (let y = surfaceHeights[bossAltarX - 16] + 2; y < bossAltarY - 10; y++) {
    setTile(bossAltarX - 16, y, BlockType.LADDER);
    setTile(bossAltarX - 15, y, BlockType.AIR);
  }

  return {
    tiles,
    spawnX: (shipPadX + 6) * 32,
    spawnY: (shipPadY - 2) * 32,
    shipX: (shipPadX + 2) * 32,
    shipY: (shipPadY - 3) * 32,
    bossAltarX: bossAltarX * 32,
    bossAltarY: bossAltarY * 32,
  };
}
