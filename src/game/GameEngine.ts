import {
  PlanetId,
  BlockType,
  InventoryItem,
  Equipment,
  SaveData,
  Recipe,
} from '../types.ts';
import { World, BoundingBox } from '../world/World.ts';
import { BLOCK_SIZE, BLOCK_DEFS } from '../world/Blocks.ts';
import { PLANETS } from '../world/Planets.ts';
import { ITEMS } from '../items/ItemDefinitions.ts';
import { Player } from '../entities/Player.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Boss } from '../entities/Boss.ts';
import { NPC, NPCS_CONFIG } from '../entities/NPC.ts';
import { Projectile } from '../entities/Projectile.ts';
import { DropItem } from '../entities/DropItem.ts';
import { ParticleSystem } from '../entities/Particle.ts';
import { Camera } from '../systems/Camera.ts';
import { SaveSystem } from '../systems/SaveSystem.ts';
import { RECIPES, canCraft } from '../systems/Crafting.ts';
import { sound } from '../audio/SoundManager.ts';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public world: World;
  public player: Player;
  public camera: Camera;
  public particles: ParticleSystem;

  public enemies: Enemy[] = [];
  public boss: Boss | null = null;
  public npcs: NPC[] = [];
  public projectiles: Projectile[] = [];
  public dropItems: DropItem[] = [];

  // Inventory & State
  public inventory: (InventoryItem | null)[] = new Array(24).fill(null);
  public hotbar: (InventoryItem | null)[] = new Array(8).fill(null);
  public equipment: Equipment;
  public selectedHotbarIndex: number = 0;
  public unlockedPlanets: PlanetId[] = ['nova'];
  public defeatedBosses: string[] = [];
  public credits: number = 50;

  // Stats
  public stats = {
    blocksMined: 0,
    enemiesKilled: 0,
    bossesKilled: 0,
    planetsVisited: 1,
    timePlayedSec: 0,
  };

  // Persistent tiles across planets
  public modifiedTilesPerPlanet: Record<PlanetId, Record<string, number>> = {
    nova: {},
    ares: {},
    void: {},
  };

  // Input states
  public keys: Record<string, boolean> = {};
  public mouseScreenX: number = 0;
  public mouseScreenY: number = 0;
  public isMouseDownLeft: boolean = false;
  public isMouseDownRight: boolean = false;

  // UI States (for React to consume)
  public isInventoryOpen: boolean = false;
  public isCraftingOpen: boolean = false;
  public isStarMapOpen: boolean = false;
  public isPaused: boolean = false;
  public activeNPC: NPC | null = null;
  public showVictory: boolean = false;
  public isWarping: boolean = false;
  public warpProgress: number = 0; // 0..1

  // Timing
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private isRunning: boolean = false;
  private autoSaveTimer: number = 0;

  // Callbacks for React state sync
  public onStateChange?: () => void;
  public onNotification?: (msg: string, color?: string) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.camera = new Camera(canvas.width, canvas.height);
    this.particles = new ParticleSystem();

    // Default init
    const defaultData = SaveSystem.createDefaultSave('nova');
    this.world = new World('nova');
    this.player = new Player(this.world.spawnX, this.world.spawnY);
    this.equipment = defaultData.equipment;
    this.inventory = defaultData.inventory;
    this.hotbar = defaultData.hotbar;

    this.initNPCs();
    this.setupInputs();
  }

  public initNPCs() {
    this.npcs = [];
    if (this.world.planet === 'nova') {
      this.npcs = NPCS_CONFIG.map((cfg) => new NPC(cfg));
    }
  }

  public startNewGame() {
    SaveSystem.clear();
    const defaultData = SaveSystem.createDefaultSave('nova');
    this.modifiedTilesPerPlanet = {
      nova: {},
      ares: {},
      void: {},
    };
    this.inventory = defaultData.inventory;
    this.hotbar = defaultData.hotbar;
    this.equipment = defaultData.equipment;
    this.unlockedPlanets = ['nova'];
    this.defeatedBosses = [];
    this.credits = defaultData.credits;
    this.stats = {
      blocksMined: 0,
      enemiesKilled: 0,
      bossesKilled: 0,
      planetsVisited: 1,
      timePlayedSec: 0,
    };

    this.world = new World('nova', {});
    this.player = new Player(this.world.spawnX, this.world.spawnY);
    this.enemies = [];
    this.projectiles = [];
    this.dropItems = [];
    this.particles = new ParticleSystem();
    this.boss = null;
    this.activeNPC = null;
    this.isInventoryOpen = false;
    this.isStarMapOpen = false;
    this.showVictory = false;
    this.isPaused = false;
    this.isWarping = false;
    this.warpProgress = 0;
    this.selectedHotbarIndex = 0;

    this.spawnPlanetEnemies();
    this.initNPCs();

    this.camera.x = this.player.x + this.player.width / 2 - this.canvas.width / 2;
    this.camera.y = this.player.y + this.player.height / 2 - this.canvas.height / 2;

    this.saveGame();
    this.notifyState();
  }

  public loadSave(save: SaveData) {
    this.inventory = save.inventory;
    this.hotbar = save.hotbar;
    this.equipment = save.equipment;
    this.unlockedPlanets = save.unlockedPlanets;
    this.defeatedBosses = save.defeatedBosses;
    this.credits = save.credits;
    this.stats = save.stats;
    this.modifiedTilesPerPlanet = {
      nova: save.modifiedTiles?.nova || {},
      ares: save.modifiedTiles?.ares || {},
      void: save.modifiedTiles?.void || {},
    };

    this.world = new World(save.planet, this.modifiedTilesPerPlanet[save.planet]);
    this.player = new Player(save.player.x, save.player.y);
    this.player.hp = save.player.hp;
    this.player.energy = save.player.energy;
    this.enemies = [];
    this.projectiles = [];
    this.dropItems = [];
    this.particles = new ParticleSystem();
    this.boss = null;
    this.activeNPC = null;
    this.isInventoryOpen = false;
    this.isStarMapOpen = false;
    this.showVictory = false;
    this.isPaused = false;
    this.isWarping = false;
    this.warpProgress = 0;

    this.spawnPlanetEnemies();
    this.initNPCs();

    this.camera.x = this.player.x + this.player.width / 2 - this.canvas.width / 2;
    this.camera.y = this.player.y + this.player.height / 2 - this.canvas.height / 2;

    this.notifyState();
  }

  public exportSave(): SaveData {
    return {
      version: 1,
      timestamp: Date.now(),
      planet: this.world.planet,
      player: {
        x: this.player.x,
        y: this.player.y,
        hp: this.player.hp,
        energy: this.player.energy,
      },
      inventory: this.inventory,
      hotbar: this.hotbar,
      equipment: this.equipment,
      unlockedPlanets: this.unlockedPlanets,
      defeatedBosses: this.defeatedBosses,
      credits: this.credits,
      stats: this.stats,
      modifiedTiles: this.modifiedTilesPerPlanet,
    };
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    sound.startAmbient();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    sound.stopAmbient();
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.resize(width, height);
  }

  // --- Input Management ---
  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Hotbar selection 1-8
      if (e.code >= 'Digit1' && e.code <= 'Digit8') {
        const slotIdx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        this.selectedHotbarIndex = slotIdx;
        sound.playClick();
        this.notifyState();
      }

      // Inventory toggle
      if (e.code === 'KeyI' || e.code === 'KeyB') {
        if (!this.isWarping) {
          this.isInventoryOpen = !this.isInventoryOpen;
          if (this.isInventoryOpen) sound.playClick();
          this.notifyState();
        }
      }

      // ESC: Close open modals or toggle pause
      if (e.code === 'Escape') {
        if (this.isInventoryOpen || this.isCraftingOpen || this.isStarMapOpen || this.activeNPC) {
          this.isInventoryOpen = false;
          this.isCraftingOpen = false;
          this.isStarMapOpen = false;
          this.activeNPC = null;
        } else {
          this.isPaused = !this.isPaused;
        }
        sound.playClick();
        this.notifyState();
      }

      // E: Interact with Spaceship, NPC, or Boss Altar
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseScreenX = e.clientX - rect.left;
      this.mouseScreenY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isPaused || this.isInventoryOpen || this.isCraftingOpen || this.isStarMapOpen || this.activeNPC) {
        return;
      }
      if (e.button === 0) {
        this.isMouseDownLeft = true;
        this.handleLeftClickAction();
      } else if (e.button === 2) {
        e.preventDefault();
        this.isMouseDownRight = true;
        this.handleRightClickAction();
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDownLeft = false;
      if (e.button === 2) this.isMouseDownRight = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private notifyState() {
    if (this.onStateChange) this.onStateChange();
  }

  public getSelectedItem(): InventoryItem | null {
    return this.hotbar[this.selectedHotbarIndex] || null;
  }

  // --- Interaction (E) ---
  private handleInteraction() {
    if (this.isPaused || this.isWarping) return;

    // 1. Check Spaceship proximity
    const shipDist = Math.hypot(
      this.player.x - (this.world.shipX + 80),
      this.player.y - (this.world.shipY + 40)
    );
    if (shipDist < 140) {
      this.isStarMapOpen = true;
      sound.playClick();
      this.notifyState();
      return;
    }

    // 2. Check NPC proximity
    for (const npc of this.npcs) {
      const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (dist < 64) {
        this.activeNPC = npc;
        sound.playClick();
        this.notifyState();
        return;
      }
    }

    // 3. Check Boss Altar proximity
    const altarDist = Math.hypot(
      this.player.x - this.world.bossAltarX,
      this.player.y - this.world.bossAltarY
    );
    if (altarDist < 120 && !this.boss) {
      this.spawnBoss();
    }
  }

  public spawnBoss() {
    this.boss = new Boss(
      this.world.planet,
      this.world.bossAltarX,
      this.world.bossAltarY - 80
    );
    this.camera.addShake(8, 0.8);
    if (this.onNotification) {
      this.onNotification(`ПРОБУЖДЕНИЕ: ${this.boss.name}!`, '#ef4444');
    }
    this.notifyState();
  }

  // --- Actions ---
  private handleLeftClickAction() {
    const selected = this.getSelectedItem();
    const itemDef = selected ? ITEMS[selected.id] : null;

    if (itemDef && itemDef.category === 'weapon') {
      this.useWeapon(itemDef);
      return;
    }

    if (itemDef && itemDef.category === 'consumable') {
      this.drinkOrUseConsumable(selected!, 'hotbar', this.selectedHotbarIndex);
      return;
    }

    // If block is selected, LMB can also place it
    if (itemDef && itemDef.category === 'block') {
      this.placeBlock(itemDef, selected!);
      return;
    }
  }

  private handleRightClickAction() {
    const selected = this.getSelectedItem();
    const itemDef = selected ? ITEMS[selected.id] : null;

    if (itemDef && itemDef.category === 'block') {
      this.placeBlock(itemDef, selected!);
    } else if (itemDef && itemDef.category === 'consumable') {
      this.drinkOrUseConsumable(selected!, 'hotbar', this.selectedHotbarIndex);
    }
  }

  public drinkOrUseConsumable(
    item: InventoryItem,
    source: 'inventory' | 'hotbar',
    index: number
  ): boolean {
    const def = ITEMS[item.id];
    if (!def || def.category !== 'consumable') return false;

    const stats = this.player.getStats(this.equipment);
    let used = false;
    let message = '';

    // Specific drink / potion effects
    if (def.drinkType === 'heal' || def.id === 'nano_medkit') {
      const heal = def.healAmount || 60;
      if (this.player.hp < stats.maxHp) {
        this.player.hp = Math.min(stats.maxHp, this.player.hp + heal);
        this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, `+${heal} HP`, '#10b981', 16);
        message = `Восстановлено +${heal} HP`;
        used = true;
      } else {
        // At max HP, drinking grants an overshield
        this.player.shieldHp = Math.min(100, this.player.shieldHp + 30);
        this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, `+30 СВЕРХЩИТ`, '#38bdf8', 16);
        message = `Полное HP! Создан щит +30`;
        used = true;
      }
    } else if (def.drinkType === 'energy' || def.id === 'energy_stim') {
      this.player.energy = this.player.maxEnergy;
      this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, '+100% ЭНЕРГИЯ', '#38bdf8', 16);
      message = 'Энергия восстановлена на 100%';
      used = true;
    } else if (def.drinkType === 'cola' || def.id === 'space_cola') {
      const heal = def.healAmount || 40;
      this.player.hp = Math.min(stats.maxHp, this.player.hp + heal);
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 60);
      this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, `+${heal} HP / +60% ЭНЕРГИЯ`, '#f43f5e', 16);
      message = `Космо-Кола: +${heal} HP и +60% энергии`;
      used = true;
    } else if (def.drinkType === 'speed' || def.id === 'speed_tonic') {
      this.player.speedBuffTime = 45;
      this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, '⚡ СКОРОСТЬ +35% (45с)', '#eab308', 16);
      message = 'Тоник скорости: +35% к скорости бега на 45 сек!';
      used = true;
    } else if (def.drinkType === 'shield' || def.id === 'shield_elixir') {
      this.player.shieldHp = Math.min(100, this.player.shieldHp + 60);
      this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, '🛡️ СИЛОВОЙ ЩИТ +60', '#06b6d4', 16);
      message = 'Сыворотка щита: энергощит +60';
      used = true;
    } else if (def.drinkType === 'magma' || def.id === 'magma_brew') {
      const heal = def.healAmount || 100;
      this.player.hp = Math.min(stats.maxHp, this.player.hp + heal);
      this.player.defenseBuffTime = 60;
      this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, `+${heal} HP / 🛡️ БРОНЯ +12 (60с)`, '#ea580c', 16);
      message = 'Магматический грог: +100 HP и броня +12 на 60 сек!';
      used = true;
    } else if (def.drinkType === 'void' || def.id === 'void_nectar') {
      this.player.hp = stats.maxHp;
      this.player.energy = this.player.maxEnergy;
      this.player.shieldHp = Math.min(100, this.player.shieldHp + 50);
      this.player.speedBuffTime = 30;
      this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, '✨ НЕКТАР БЕЗДНЫ: ВСЕ ХАРАКТЕРИСТИКИ MAX!', '#c084fc', 18);
      message = 'Нектар Бездны: полное исцеление, 100% энергии, щит +50 и ускорение!';
      used = true;
    } else {
      // Fallback
      if (def.healAmount) {
        this.player.hp = Math.min(stats.maxHp, this.player.hp + def.healAmount);
        this.particles.spawnFloatingText(this.player.x + 11, this.player.y - 12, `+${def.healAmount} HP`, '#10b981', 16);
      }
      used = true;
    }

    if (used) {
      sound.playDrink();
      this.particles.spawnSparks(this.player.x + 11, this.player.y + 15, def.iconColor, 16);

      // Decrement item count
      item.count -= 1;
      if (item.count <= 0) {
        if (source === 'inventory') {
          this.inventory[index] = null;
        } else {
          this.hotbar[index] = null;
        }
      }

      if (this.onNotification) {
        this.onNotification(`🥤 Выпито: ${def.name}! ${message}`, def.iconColor);
      }
      this.notifyState();
      return true;
    }

    return false;
  }

  private useWeapon(itemDef: typeof ITEMS[string]) {
    const mouseWorld = this.camera.screenToWorld(this.mouseScreenX, this.mouseScreenY);
    const pCenter = { x: this.player.x + this.player.width / 2, y: this.player.y + 20 };
    const dx = mouseWorld.x - pCenter.x;
    const dy = mouseWorld.y - pCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;

    if (itemDef.isRanged) {
      // Ranged weapon
      const cost = itemDef.energyCost || 8;
      if (this.player.energy >= cost) {
        this.player.energy -= cost;
        sound.playLaser();
        const speed = 12;
        const color = itemDef.iconColor || '#38bdf8';
        this.projectiles.push(
          new Projectile(
            pCenter.x,
            pCenter.y,
            (dx / dist) * speed,
            (dy / dist) * speed,
            itemDef.damage || 15,
            false,
            color,
            5
          )
        );
      }
    } else {
      // Melee weapon swing
      this.player.swingWeapon();
      sound.playSlash();

      // Check hits on enemies in melee range
      const swingRange = 85;
      for (const enemy of this.enemies) {
        const eDist = Math.hypot(enemy.x - pCenter.x, enemy.y - pCenter.y);
        if (eDist < swingRange) {
          const killed = enemy.takeDamage(
            itemDef.damage || 25,
            this.player.facing * 5,
            -3,
            this.particles
          );
          if (killed) this.handleEnemyKilled(enemy);
        }
      }

      // Check hit on boss
      if (this.boss) {
        const bDist = Math.hypot(
          this.boss.x + this.boss.width / 2 - pCenter.x,
          this.boss.y + this.boss.height / 2 - pCenter.y
        );
        if (bDist < swingRange + 30) {
          const killed = this.boss.takeDamage(itemDef.damage || 25, this.particles);
          if (killed) this.handleBossKilled();
        }
      }
    }
  }

  private placeBlock(itemDef: typeof ITEMS[string], item: InventoryItem) {
    const mouseWorld = this.camera.screenToWorld(this.mouseScreenX, this.mouseScreenY);
    const tileX = Math.floor(mouseWorld.x / BLOCK_SIZE);
    const tileY = Math.floor(mouseWorld.y / BLOCK_SIZE);

    const playerBox: BoundingBox = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height,
    };

    // Check reach distance (~180px)
    const pCenter = { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 };
    const dist = Math.hypot(mouseWorld.x - pCenter.x, mouseWorld.y - pCenter.y);
    if (dist > 180) return;

    if (itemDef.blockType && this.world.canPlaceBlock(tileX, tileY, playerBox)) {
      this.world.setTile(tileX, tileY, itemDef.blockType);
      this.modifiedTilesPerPlanet[this.world.planet][`${tileX},${tileY}`] = itemDef.blockType;
      sound.playBlockPlace();
      this.particles.spawnDebris(tileX * BLOCK_SIZE + 16, tileY * BLOCK_SIZE + 16, itemDef.iconColor, 4);

      item.count -= 1;
      if (item.count <= 0) {
        this.hotbar[this.selectedHotbarIndex] = null;
      }
      this.notifyState();
    }
  }

  // Continuous mining check on hold
  private handleMining(dt: number) {
    if (!this.isMouseDownLeft) return;

    const selected = this.getSelectedItem();
    const itemDef = selected ? ITEMS[selected.id] : null;
    // Don't mine if currently firing a ranged weapon
    if (itemDef && itemDef.category === 'weapon' && itemDef.isRanged) return;

    const mouseWorld = this.camera.screenToWorld(this.mouseScreenX, this.mouseScreenY);
    const tileX = Math.floor(mouseWorld.x / BLOCK_SIZE);
    const tileY = Math.floor(mouseWorld.y / BLOCK_SIZE);

    const pCenter = { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 };
    const dist = Math.hypot(mouseWorld.x - pCenter.x, mouseWorld.y - pCenter.y);
    if (dist > 180) return; // reach limit

    const tile = this.world.getTile(tileX, tileY);
    if (tile === BlockType.AIR || tile === BlockType.SPACESHIP_HULL) return;

    const stats = this.player.getStats(this.equipment);
    let power = stats.miningPower;
    if (itemDef && itemDef.miningPower) {
      power = itemDef.miningPower;
    }

    const mineDamage = power * 24 * dt;
    const res = this.world.damageBlock(tileX, tileY, mineDamage);

    if (Math.random() < 0.3) {
      sound.playMineHit();
      this.player.swingWeapon();
      const def = this.world.getBlockDef(tileX, tileY);
      this.particles.spawnSparks(mouseWorld.x, mouseWorld.y, def.edgeColor || '#ffffff', 2);
    }

    if (res.destroyed) {
      sound.playBlockBreak();
      this.stats.blocksMined++;
      this.modifiedTilesPerPlanet[this.world.planet][`${tileX},${tileY}`] = BlockType.AIR;
      const def = BLOCK_DEFS[tile];
      this.particles.spawnDebris(tileX * BLOCK_SIZE + 16, tileY * BLOCK_SIZE + 16, def.color, 8);

      if (res.dropItem) {
        this.dropItems.push(
          new DropItem(tileX * BLOCK_SIZE + 8, tileY * BLOCK_SIZE + 8, res.dropItem, res.dropCount || 1)
        );
      }
    }
  }

  // --- Planet Travel ---
  public switchPlanet(newPlanet: PlanetId, animate: boolean = true) {
    if (animate) {
      this.isWarping = true;
      this.warpProgress = 0;
      this.isStarMapOpen = false;
      sound.playWarp();
      this.camera.addShake(12, 1.2);
    }

    setTimeout(() => {
      this.world = new World(newPlanet, this.modifiedTilesPerPlanet[newPlanet]);
      this.player.x = this.world.spawnX;
      this.player.y = this.world.spawnY;
      this.player.vx = 0;
      this.player.vy = 0;

      // Spawn native planet enemies
      this.spawnPlanetEnemies();
      this.initNPCs();
      this.boss = null;
      this.projectiles = [];
      this.dropItems = [];

      if (!this.unlockedPlanets.includes(newPlanet)) {
        this.unlockedPlanets.push(newPlanet);
      }
      this.stats.planetsVisited = this.unlockedPlanets.length;

      if (this.onNotification) {
        this.onNotification(`ПРИБЫТИЕ: ${PLANETS[newPlanet].russianName}`, PLANETS[newPlanet].themeColor);
      }

      this.saveGame();
      this.notifyState();
    }, animate ? 600 : 0);
  }

  private spawnPlanetEnemies() {
    this.enemies = [];
    const planet = this.world.planet;

    // Spawn 10-15 enemies along surface and caves
    for (let i = 0; i < 14; i++) {
      const ex = (Math.random() * (this.world.width - 20) + 10) * BLOCK_SIZE;
      const ey = (Math.random() * 50 + 25) * BLOCK_SIZE;

      // Don't spawn right on landing base
      if (ex > 25 * BLOCK_SIZE && ex < 70 * BLOCK_SIZE && ey < 40 * BLOCK_SIZE) continue;

      if (planet === 'nova') {
        const type = Math.random() > 0.4 ? 'swarmer' : 'hover_scout';
        this.enemies.push(new Enemy(type, ex, ey));
      } else if (planet === 'ares') {
        const type = Math.random() > 0.4 ? 'crimson_stalker' : 'armored_golem';
        this.enemies.push(new Enemy(type, ex, ey));
      } else {
        const type = Math.random() > 0.4 ? 'void_phantom' : 'armored_golem';
        this.enemies.push(new Enemy(type, ex, ey));
      }
    }
  }

  private handleEnemyKilled(enemy: Enemy) {
    this.stats.enemiesKilled++;
    const drops = enemy.getDrops();
    this.dropItems.push(...drops);
  }

  private handleBossKilled() {
    if (!this.boss) return;
    this.stats.bossesKilled++;
    const key = this.boss.planet;
    if (!this.defeatedBosses.includes(key)) {
      this.defeatedBosses.push(key);
    }

    const drops = this.boss.getDrops();
    this.dropItems.push(...drops);

    if (this.onNotification) {
      this.onNotification(`БОСС ПОВЕРЖЕН: ${this.boss.name}!`, '#fbbf24');
    }

    if (this.boss.planet === 'void') {
      // Victory Screen!
      setTimeout(() => {
        this.showVictory = true;
        this.notifyState();
      }, 1500);
    }

    this.boss = null;
    this.saveGame();
    this.notifyState();
  }

  // --- Inventory & Crafting ---
  public addItem(itemId: string, count: number = 1): boolean {
    // 1. Try stacking in hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.id === itemId) {
        slot.count += count;
        return true;
      }
    }
    // 2. Try stacking in inventory
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      if (slot && slot.id === itemId) {
        slot.count += count;
        return true;
      }
    }
    // 3. Find empty hotbar slot
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { id: itemId, count };
        return true;
      }
    }
    // 4. Find empty inventory slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { id: itemId, count };
        return true;
      }
    }
    return false; // inventory full
  }

  public craftRecipe(recipe: Recipe): boolean {
    if (!canCraft(recipe, this.inventory, this.hotbar)) return false;

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      let needed = ing.count;

      // Deduct from hotbar first
      for (let i = 0; i < this.hotbar.length; i++) {
        const slot = this.hotbar[i];
        if (slot && slot.id === ing.itemId) {
          const take = Math.min(needed, slot.count);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) this.hotbar[i] = null;
          if (needed <= 0) break;
        }
      }

      // Deduct from inventory
      if (needed > 0) {
        for (let i = 0; i < this.inventory.length; i++) {
          const slot = this.inventory[i];
          if (slot && slot.id === ing.itemId) {
            const take = Math.min(needed, slot.count);
            slot.count -= take;
            needed -= take;
            if (slot.count <= 0) this.inventory[i] = null;
            if (needed <= 0) break;
          }
        }
      }
    }

    // Add crafted result
    this.addItem(recipe.resultId, recipe.resultCount);
    sound.playCraft();
    const itemDef = ITEMS[recipe.resultId];
    if (this.onNotification) {
      this.onNotification(`Создано: ${itemDef?.name || recipe.resultId} x${recipe.resultCount}`, '#10b981');
    }
    this.notifyState();
    return true;
  }

  public saveGame() {
    const data = this.exportSave();
    SaveSystem.save(data);
  }

  // --- Main Game Loop ---
  private loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.stats.timePlayedSec += dt;
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 30) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }

    if (this.isWarping) {
      this.warpProgress += dt * 1.5;
      if (this.warpProgress >= 1) {
        this.isWarping = false;
        this.warpProgress = 0;
      }
      return;
    }

    const stats = this.player.getStats(this.equipment);

    // Player update
    this.player.update(this.world, this.keys, this.particles, stats, this.equipment, dt);

    // Continuous mining
    this.handleMining(dt);

    // Camera follow
    this.camera.update(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, dt);

    // Particles & Texts
    this.particles.update(dt);

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(this.world, this.particles, dt);

      // Hit player
      if (proj.isEnemy && !proj.dead) {
        const pDist = Math.hypot(
          proj.x - (this.player.x + this.player.width / 2),
          proj.y - (this.player.y + this.player.height / 2)
        );
        if (pDist < proj.radius + 12) {
          proj.dead = true;
          this.player.takeDamage(proj.damage, this.particles, stats);
        }
      }

      // Hit enemies
      if (!proj.isEnemy && !proj.dead) {
        for (const enemy of this.enemies) {
          const eDist = Math.hypot(
            proj.x - (enemy.x + enemy.config.width / 2),
            proj.y - (enemy.y + enemy.config.height / 2)
          );
          if (eDist < proj.radius + enemy.config.width / 2) {
            proj.dead = true;
            const killed = enemy.takeDamage(
              proj.damage,
              proj.vx * 0.4,
              -2,
              this.particles
            );
            if (killed) this.handleEnemyKilled(enemy);
            break;
          }
        }

        // Hit boss
        if (this.boss && !proj.dead) {
          const bDist = Math.hypot(
            proj.x - (this.boss.x + this.boss.width / 2),
            proj.y - (this.boss.y + this.boss.height / 2)
          );
          if (bDist < proj.radius + this.boss.width / 2) {
            proj.dead = true;
            const killed = this.boss.takeDamage(proj.damage, this.particles);
            if (killed) this.handleBossKilled();
          }
        }
      }

      if (proj.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(
        this.world,
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.projectiles,
        this.particles,
        dt
      );

      // Enemy touch damage on player
      const dist = Math.hypot(
        enemy.x + enemy.config.width / 2 - (this.player.x + this.player.width / 2),
        enemy.y + enemy.config.height / 2 - (this.player.y + this.player.height / 2)
      );
      if (dist < 28 && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 0.8;
        this.player.takeDamage(enemy.config.damage, this.particles, stats);
      }

      if (enemy.dead) {
        this.enemies.splice(i, 1);
      }
    }

    // Boss
    if (this.boss) {
      this.boss.update(
        this.world,
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.projectiles,
        this.enemies,
        this.particles,
        dt
      );

      // Boss collision with player
      const bDist = Math.hypot(
        this.boss.x + this.boss.width / 2 - (this.player.x + this.player.width / 2),
        this.boss.y + this.boss.height / 2 - (this.player.y + this.player.height / 2)
      );
      if (bDist < this.boss.width / 2 + 10) {
        this.player.takeDamage(24, this.particles, stats);
      }
    }

    // Drop Items
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const item = this.dropItems[i];
      item.update(this.world, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, dt);

      // Pickup distance check
      const dist = Math.hypot(
        item.x - (this.player.x + this.player.width / 2),
        item.y - (this.player.y + this.player.height / 2)
      );
      if (dist < 26) {
        const added = this.addItem(item.itemId, item.count);
        if (added) {
          sound.playPickup();
          const def = ITEMS[item.itemId];
          this.particles.spawnFloatingText(
            this.player.x,
            this.player.y - 12,
            `+${item.count} ${def?.name || item.itemId}`,
            def?.iconColor || '#38bdf8'
          );
          this.dropItems.splice(i, 1);
          this.notifyState();
        }
      }
    }

    // Respawn check
    if (this.player.dead && this.player.invulnTime <= -1.0) {
      this.player.respawn(this.world.spawnX, this.world.spawnY);
      if (this.onNotification) {
        this.onNotification('СКАФАНДР ВОССТАНОВЛЕН НА БАЗЕ', '#38bdf8');
      }
      this.notifyState();
    }
  }

  private render() {
    const ctx = this.ctx;
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;

    ctx.clearRect(0, 0, viewW, viewH);

    // 1. Parallax Stars and Planet Background
    this.world.renderBackground(ctx, this.camera.x, this.camera.y, viewW, viewH);

    // 2. World Tiles
    this.world.renderWorldTiles(ctx, this.camera.x, this.camera.y, viewW, viewH);

    // 3. Drop Items
    for (const item of this.dropItems) {
      item.render(ctx, this.camera.x, this.camera.y);
    }

    // 4. NPCs
    for (const npc of this.npcs) {
      const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      npc.render(ctx, this.camera.x, this.camera.y, dist < 64);
    }

    // 5. Enemies
    for (const enemy of this.enemies) {
      enemy.render(ctx, this.camera.x, this.camera.y);
    }

    // 6. Boss
    if (this.boss) {
      this.boss.render(ctx, this.camera.x, this.camera.y);
    }

    // 7. Player
    const mouseWorld = this.camera.screenToWorld(this.mouseScreenX, this.mouseScreenY);
    const mouseAngle = Math.atan2(
      mouseWorld.y - (this.player.y + 20),
      mouseWorld.x - (this.player.x + this.player.width / 2)
    );
    this.player.render(
      ctx,
      this.camera.x,
      this.camera.y,
      mouseAngle,
      this.getSelectedItem(),
      this.equipment
    );

    // 8. Projectiles
    for (const proj of this.projectiles) {
      proj.render(ctx, this.camera.x, this.camera.y);
    }

    // 9. Particles and Floating Texts
    this.particles.render(ctx, this.camera.x, this.camera.y);

    // 10. Hologram Preview for Building Blocks
    this.renderPlacementHologram(ctx);

    // 11. Hyperspace Warp Overlay
    if (this.isWarping) {
      this.renderWarpEffect(ctx, viewW, viewH);
    }
  }

  private renderPlacementHologram(ctx: CanvasRenderingContext2D) {
    const selected = this.getSelectedItem();
    if (!selected) return;

    const itemDef = ITEMS[selected.id];
    if (!itemDef || itemDef.category !== 'block' || !itemDef.blockType) return;

    const mouseWorld = this.camera.screenToWorld(this.mouseScreenX, this.mouseScreenY);
    const tileX = Math.floor(mouseWorld.x / BLOCK_SIZE);
    const tileY = Math.floor(mouseWorld.y / BLOCK_SIZE);

    const screenX = tileX * BLOCK_SIZE - this.camera.x;
    const screenY = tileY * BLOCK_SIZE - this.camera.y;

    const playerBox: BoundingBox = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height,
    };
    const canPlace = this.world.canPlaceBlock(tileX, tileY, playerBox);

    ctx.save();
    ctx.fillStyle = canPlace ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
    ctx.strokeStyle = canPlace ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
    ctx.restore();
  }

  private renderWarpEffect(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 0, 20, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Streaking warp lines
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const len = this.warpProgress * Math.max(w, h);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.fillText('СОВЕРШАЕТСЯ ГИПЕРПРОСТРАНСТВЕННЫЙ ПРЫЖОК...', cx, cy);
    ctx.restore();
  }
}
