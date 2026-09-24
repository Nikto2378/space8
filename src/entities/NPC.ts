export interface TradeItem {
  id: string;
  itemId: string;
  priceItemId: string;
  priceCount: number;
  count: number;
}

export interface NPCData {
  id: 'engineer' | 'merchant' | 'explorer';
  name: string;
  role: string;
  color: string;
  visorColor: string;
  x: number;
  y: number;
  dialogue: string[];
  tips: string[];
  trades?: TradeItem[];
}

export const NPCS_CONFIG: NPCData[] = [
  {
    id: 'engineer',
    name: 'Алекс Вэнс',
    role: 'Главный инженер базы',
    color: '#0284c7',
    visorColor: '#38bdf8',
    x: 52 * 32,
    y: 30 * 32,
    dialogue: [
      'Приветствую, пилот! Скафандр функционирует штатно. Я отвечаю за сборку модулей и модернизацию инструментов.',
      'Начни с добычи меди и железа в верхних пещерах. Создай плазменную кирку на вкладке Крафта (клавиша I) — она позволит бурить титан и редкие кристаллы намного быстрее!',
      'Если найдешь реактивный ранец — сможешь парить в воздухе над лавовыми провалами. Береги энергоблок!',
    ],
    tips: [
      'Совет: клавиша I открывает Инвентарь и Меню крафта.',
      'Совет: правый клик мыши ставит выбранный строительный блок.',
      'Совет: чтобы спуститься на платформе, нажми S.',
    ],
  },
  {
    id: 'merchant',
    name: 'Зайра Новак',
    role: 'Снабженец и торговец',
    color: '#d97706',
    visorColor: '#fbbf24',
    x: 57 * 32,
    y: 30 * 32,
    dialogue: [
      'Добро пожаловать в снабженческий модуль! У меня есть всё для автономного выживания.',
      'Принеси мне руду и кристаллы, и я обменяю их на космические напитки, нано-тоники, батареи и стройматериалы!',
    ],
    tips: ['Совет: ты можешь пить напитки и тоники прямо в инвентаре (клавиша I) для лечения и баффов!'],
    trades: [
      { id: 't1', itemId: 'nano_medkit', priceItemId: 'copper_ore', priceCount: 3, count: 2 },
      { id: 't2', itemId: 'energy_stim', priceItemId: 'cyan_crystal', priceCount: 1, count: 2 },
      { id: 't6', itemId: 'space_cola', priceItemId: 'stone', priceCount: 4, count: 2 },
      { id: 't7', itemId: 'speed_tonic', priceItemId: 'cyan_crystal', priceCount: 2, count: 1 },
      { id: 't3', itemId: 'block_tech_panel', priceItemId: 'stone', priceCount: 6, count: 10 },
      { id: 't4', itemId: 'block_neon_light', priceItemId: 'copper_ore', priceCount: 2, count: 4 },
      { id: 't5', itemId: 'plasma_blade', priceItemId: 'iron_ore', priceCount: 8, count: 1 },
    ],
  },
  {
    id: 'explorer',
    name: 'Корвус Рид',
    role: 'Астробиолог и картограф',
    color: '#7c3aed',
    visorColor: '#c084fc',
    x: 62 * 32,
    y: 30 * 32,
    dialogue: [
      'Планетарные сенсоры зафиксировали колоссальные сигнатуры в недрах!',
      'Глубоко под землей на каждой планете скрыты Древние Алтари. На этой планете запечатан Древний Страж Ядра. Победив его, ты получишь Варп-Двигатель для корабля!',
      'Вторая планета (Красная) содержит пламенный титан и охраняется Левиафаном. А за ней — таинственная Пустошь, дом Омега-Оверлорда.',
    ],
    tips: [
      'Совет: спускайся по пещерам вниз направо (координаты около X=140), чтобы найти Арену Босса.',
      'Совет: подойди к Космическому кораблю и нажми E, чтобы открыть Карту Галактики.',
    ],
  },
];

export class NPC {
  public data: NPCData;
  public x: number;
  public y: number;
  public width: number = 24;
  public height: number = 44;

  constructor(data: NPCData) {
    this.data = data;
    this.x = data.x;
    this.y = data.y;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, playerNear: boolean) {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY;

    ctx.save();
    // Body / Suit
    ctx.fillStyle = this.data.color;
    ctx.fillRect(sx + 4, sy + 14, 16, 20);

    // Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx + 4, sy + 34, 6, 10);
    ctx.fillRect(sx + 14, sy + 34, 6, 10);

    // Helmet
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    // Visor glow
    ctx.fillStyle = this.data.visorColor;
    ctx.shadowColor = this.data.visorColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 10, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Name tag & role
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.data.name, sx + 12, sy - 8);

    ctx.font = '9px sans-serif';
    ctx.fillStyle = this.data.visorColor;
    ctx.fillText(this.data.role, sx + 12, sy + 2);

    // Press E indicator if player is close
    if (playerNear) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('[E] Разговаривать', sx + 12, sy - 22);
    }

    ctx.restore();
  }
}
