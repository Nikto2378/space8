export type PlanetId = 'nova' | 'ares' | 'void';

export interface PlanetConfig {
  id: PlanetId;
  name: string;
  russianName: string;
  tagline: string;
  themeColor: string;
  accentColor: string;
  skyGradient: [string, string, string];
  surfaceColor: string;
  gravity: number;
  bossName: string;
  bossKeyItem: string;
  requiredItemToVisit?: string;
  description: string;
}

export enum BlockType {
  AIR = 0,
  // Nova Blocks
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COPPER_ORE = 4,
  IRON_ORE = 5,
  CYAN_CRYSTAL = 6,
  BASE_WALL = 7,
  BASE_PLATING = 8,
  
  // Ares Blocks
  CRIMSON_ROCK = 9,
  BASALT = 10,
  ENERGY_MINERAL = 11,
  TITANIUM_ORE = 12,
  MAGMA_CORE = 13,
  HEAT_GLASS = 14,

  // Void Blocks
  VOID_STONE = 15,
  VOID_CRYSTAL = 16,
  ASTRITE_ORE = 17,
  DARK_MATTER = 18,
  COSMIC_PANEL = 19,

  // Craftable / Structural
  TECH_PANEL = 20,
  REINFORCED_METAL = 21,
  NANO_GLASS = 22,
  NEON_LIGHT = 23,
  SPACESHIP_HULL = 24,
  LADDER = 25
}

export interface BlockDef {
  type: BlockType;
  name: string;
  hardness: number; // Dig time in hits/sec
  color: string;
  edgeColor?: string;
  light?: number; // 0 to 1
  solid: boolean;
  dropItem: string;
  dropCount?: [number, number];
  isPlatform?: boolean;
}

export type ItemCategory = 'resource' | 'weapon' | 'tool' | 'armor' | 'consumable' | 'block' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  iconColor: string;
  stackable: boolean;
  maxStack?: number;
  // Specific properties
  blockType?: BlockType;
  damage?: number;
  miningPower?: number; // 1 to 5
  defense?: number;
  healAmount?: number;
  speedBonus?: number;
  isRanged?: boolean;
  energyCost?: number;
  isDrinkable?: boolean;
  drinkType?: 'heal' | 'energy' | 'cola' | 'speed' | 'magma' | 'shield' | 'void';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface InventoryItem {
  id: string;
  count: number;
}

export interface Recipe {
  id: string;
  resultId: string;
  resultCount: number;
  category: 'tools' | 'weapons' | 'armor' | 'consumables' | 'blocks' | 'tech';
  ingredients: { itemId: string; count: number }[];
  description: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  defense: number;
  miningPower: number;
  damage: number;
  speed: number;
}

export interface Equipment {
  weapon: InventoryItem | null;
  tool: InventoryItem | null;
  armor: InventoryItem | null;
  booster: InventoryItem | null;
}

export interface SaveData {
  version: number;
  timestamp: number;
  planet: PlanetId;
  player: {
    x: number;
    y: number;
    hp: number;
    energy: number;
  };
  inventory: (InventoryItem | null)[];
  hotbar: (InventoryItem | null)[];
  equipment: Equipment;
  unlockedPlanets: PlanetId[];
  defeatedBosses: string[];
  credits: number;
  stats: {
    blocksMined: number;
    enemiesKilled: number;
    bossesKilled: number;
    planetsVisited: number;
    timePlayedSec: number;
  };
  modifiedTiles: Record<string, Record<string, number>>; // planetId -> "x,y" -> blockType
}
