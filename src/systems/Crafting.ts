import { Recipe, InventoryItem } from '../types.ts';

export const RECIPES: Recipe[] = [
  // --- Consumables & Survival ---
  {
    id: 'craft_medkit',
    resultId: 'nano_medkit',
    resultCount: 2,
    category: 'consumables',
    ingredients: [
      { itemId: 'cyan_crystal', count: 1 },
      { itemId: 'copper_ore', count: 2 },
    ],
    description: 'Наниты первой помощи. Восстанавливают 60 HP.',
  },
  {
    id: 'craft_energy_stim',
    resultId: 'energy_stim',
    resultCount: 2,
    category: 'consumables',
    ingredients: [
      { itemId: 'energy_mineral', count: 1 },
      { itemId: 'copper_ore', count: 2 },
    ],
    description: 'Стимулирует энергосистему скафандра.',
  },

  // --- Tools & Mining ---
  {
    id: 'craft_plasma_pickaxe',
    resultId: 'plasma_pickaxe',
    resultCount: 1,
    category: 'tools',
    ingredients: [
      { itemId: 'iron_ore', count: 8 },
      { itemId: 'cyan_crystal', count: 4 },
      { itemId: 'copper_ore', count: 5 },
    ],
    description: 'Улучшенная кирка: в 2.5 раза быстрее разрушает породу.',
  },
  {
    id: 'craft_quantum_disintegrator',
    resultId: 'quantum_disintegrator',
    resultCount: 1,
    category: 'tools',
    ingredients: [
      { itemId: 'titanium_ore', count: 10 },
      { itemId: 'astrite_ore', count: 5 },
      { itemId: 'dark_matter', count: 2 },
    ],
    description: 'Мгновенное разрушение любых блоков и минералов.',
  },

  // --- Weapons ---
  {
    id: 'craft_plasma_blade',
    resultId: 'plasma_blade',
    resultCount: 1,
    category: 'weapons',
    ingredients: [
      { itemId: 'iron_ore', count: 6 },
      { itemId: 'cyan_crystal', count: 3 },
    ],
    description: 'Энергетический меч для ближнего боя с широким размахом.',
  },
  {
    id: 'craft_pulse_pistol',
    resultId: 'pulse_pistol',
    resultCount: 1,
    category: 'weapons',
    ingredients: [
      { itemId: 'copper_ore', count: 6 },
      { itemId: 'cyan_crystal', count: 3 },
    ],
    description: 'Дальнобойный импульсный бластер.',
  },
  {
    id: 'craft_magma_cleaver',
    resultId: 'magma_cleaver',
    resultCount: 1,
    category: 'weapons',
    ingredients: [
      { itemId: 'magma_core', count: 3 },
      { itemId: 'basalt', count: 10 },
      { itemId: 'titanium_ore', count: 5 },
    ],
    description: 'Мощный огненный клинок Красной планеты.',
  },
  {
    id: 'craft_laser_carbine',
    resultId: 'laser_carbine',
    resultCount: 1,
    category: 'weapons',
    ingredients: [
      { itemId: 'titanium_ore', count: 8 },
      { itemId: 'energy_mineral', count: 6 },
    ],
    description: 'Скорострельный лазерный карабин дальнего боя.',
  },
  {
    id: 'craft_void_cannon',
    resultId: 'void_cannon',
    resultCount: 1,
    category: 'weapons',
    ingredients: [
      { itemId: 'astrite_ore', count: 12 },
      { itemId: 'void_crystal', count: 8 },
      { itemId: 'dark_matter', count: 4 },
    ],
    description: 'Абсолютное оружие Пустоты: сокрушительные гравитационные заряды.',
  },

  // --- Armor & Suits ---
  {
    id: 'craft_suit_scout',
    resultId: 'suit_scout',
    resultCount: 1,
    category: 'armor',
    ingredients: [
      { itemId: 'iron_ore', count: 10 },
      { itemId: 'copper_ore', count: 8 },
    ],
    description: 'Скафандр «Разведчик»: +30 HP, +10% к скорости перемещения.',
  },
  {
    id: 'craft_suit_hazard',
    resultId: 'suit_hazard',
    resultCount: 1,
    category: 'armor',
    ingredients: [
      { itemId: 'titanium_ore', count: 12 },
      { itemId: 'energy_mineral', count: 6 },
      { itemId: 'basalt', count: 15 },
    ],
    description: 'Тяжелый термо-экзоскелет: +70 HP, высокая броня.',
  },
  {
    id: 'craft_suit_void',
    resultId: 'suit_void',
    resultCount: 1,
    category: 'armor',
    ingredients: [
      { itemId: 'astrite_ore', count: 14 },
      { itemId: 'dark_matter', count: 4 },
      { itemId: 'void_crystal', count: 6 },
    ],
    description: 'Квантовый скафандр «Апогей»: +150 HP, максимальная защита.',
  },

  // --- Jetpack Boosters ---
  {
    id: 'craft_jetpack_mk1',
    resultId: 'jetpack_mk1',
    resultCount: 1,
    category: 'armor',
    ingredients: [
      { itemId: 'iron_ore', count: 8 },
      { itemId: 'cyan_crystal', count: 5 },
      { itemId: 'copper_ore', count: 6 },
    ],
    description: 'Реактивный ранец: удерживайте W или Пробел для полета.',
  },
  {
    id: 'craft_jetpack_mk2',
    resultId: 'jetpack_mk2',
    resultCount: 1,
    category: 'armor',
    ingredients: [
      { itemId: 'titanium_ore', count: 10 },
      { itemId: 'energy_mineral', count: 8 },
      { itemId: 'jetpack_mk1', count: 1 },
    ],
    description: 'Гравитационный ранец Mk.2: повышенная тяга и длительность полета.',
  },

  // --- Building Blocks ---
  {
    id: 'craft_tech_panel',
    resultId: 'block_tech_panel',
    resultCount: 6,
    category: 'blocks',
    ingredients: [
      { itemId: 'copper_ore', count: 2 },
      { itemId: 'stone', count: 4 },
    ],
    description: 'Герметичные стеновые панели космической базы (6 шт).',
  },
  {
    id: 'craft_reinforced_metal',
    resultId: 'block_reinforced_metal',
    resultCount: 6,
    category: 'blocks',
    ingredients: [
      { itemId: 'iron_ore', count: 3 },
      { itemId: 'stone', count: 3 },
    ],
    description: 'Прочные бронеплиты (6 шт).',
  },
  {
    id: 'craft_nano_glass',
    resultId: 'block_nano_glass',
    resultCount: 4,
    category: 'blocks',
    ingredients: [
      { itemId: 'stone', count: 4 },
      { itemId: 'cyan_crystal', count: 1 },
    ],
    description: 'Прозрачные светопропускающие окна (4 шт).',
  },
  {
    id: 'craft_neon_light',
    resultId: 'block_neon_light',
    resultCount: 3,
    category: 'blocks',
    ingredients: [
      { itemId: 'copper_ore', count: 2 },
      { itemId: 'cyan_crystal', count: 2 },
    ],
    description: 'Яркие энерго-блоки для освещения (3 шт).',
  },
  {
    id: 'craft_ladder',
    resultId: 'ladder',
    resultCount: 6,
    category: 'blocks',
    ingredients: [
      { itemId: 'copper_ore', count: 2 },
      { itemId: 'stone', count: 2 },
    ],
    description: 'Энерго-платформы для вертикального подъема (6 шт).',
  },

  // --- Space Drinks & Consumables ---
  {
    id: 'craft_nano_medkit',
    resultId: 'nano_medkit',
    resultCount: 2,
    category: 'consumables',
    ingredients: [
      { itemId: 'cyan_crystal', count: 1 },
      { itemId: 'copper_ore', count: 2 },
    ],
    description: 'Нано-тоник «Био-Реген» (2 шт): исцеляет 60 HP или формирует щит.',
  },
  {
    id: 'craft_space_cola',
    resultId: 'space_cola',
    resultCount: 3,
    category: 'consumables',
    ingredients: [
      { itemId: 'copper_ore', count: 1 },
      { itemId: 'stone', count: 3 },
    ],
    description: 'Космо-Кола «Звездная пыль» (3 шт): освежающий напиток (+40 HP, +60% энергии).',
  },
  {
    id: 'craft_energy_stim',
    resultId: 'energy_stim',
    resultCount: 2,
    category: 'consumables',
    ingredients: [
      { itemId: 'cyan_crystal', count: 1 },
      { itemId: 'iron_ore', count: 2 },
    ],
    description: 'Космо-Энергетик «Гипер-Драйв» (2 шт): восстанавливает 100% энергии.',
  },
  {
    id: 'craft_speed_tonic',
    resultId: 'speed_tonic',
    resultCount: 1,
    category: 'consumables',
    ingredients: [
      { itemId: 'cyan_crystal', count: 2 },
      { itemId: 'iron_ore', count: 3 },
    ],
    description: 'Антигравитационный тоник: ускорение передвижения на +35% на 45 сек.',
  },
  {
    id: 'craft_shield_elixir',
    resultId: 'shield_elixir',
    resultCount: 1,
    category: 'consumables',
    ingredients: [
      { itemId: 'cyan_crystal', count: 3 },
      { itemId: 'iron_ore', count: 4 },
    ],
    description: 'Плазменная сыворотка щита: мощный силовой энергощит на 60 единиц.',
  },
  {
    id: 'craft_magma_brew',
    resultId: 'magma_brew',
    resultCount: 1,
    category: 'consumables',
    ingredients: [
      { itemId: 'magma_core', count: 1 },
      { itemId: 'energy_mineral', count: 2 },
      { itemId: 'basalt', count: 4 },
    ],
    description: 'Магматический грог Ареса: восстанавливает 100 HP и дает +12 брони на 60 сек.',
  },
  {
    id: 'craft_void_nectar',
    resultId: 'void_nectar',
    resultCount: 1,
    category: 'consumables',
    ingredients: [
      { itemId: 'void_crystal', count: 2 },
      { itemId: 'astrite_ore', count: 2 },
      { itemId: 'dark_matter', count: 1 },
    ],
    description: 'Нектар Бездны: абсолютный космический напиток — HP, Энергия, Щит +50 и Ускорение!',
  },
];

export function canCraft(
  recipe: Recipe,
  inventory: (InventoryItem | null)[],
  hotbar: (InventoryItem | null)[]
): boolean {
  // Count items across inventory and hotbar
  const itemCounts: Record<string, number> = {};

  const processSlot = (slot: InventoryItem | null) => {
    if (slot) {
      itemCounts[slot.id] = (itemCounts[slot.id] || 0) + slot.count;
    }
  };

  inventory.forEach(processSlot);
  hotbar.forEach(processSlot);

  for (const ing of recipe.ingredients) {
    if ((itemCounts[ing.itemId] || 0) < ing.count) {
      return false;
    }
  }

  return true;
}

export function getItemCount(
  itemId: string,
  inventory: (InventoryItem | null)[],
  hotbar: (InventoryItem | null)[]
): number {
  let count = 0;
  const countIn = (slot: InventoryItem | null) => {
    if (slot && slot.id === itemId) {
      count += slot.count;
    }
  };
  inventory.forEach(countIn);
  hotbar.forEach(countIn);
  return count;
}
