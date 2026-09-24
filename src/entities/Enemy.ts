import { World } from '../world/World.ts';
import { ParticleSystem } from './Particle.ts';
import { Projectile } from './Projectile.ts';
import { DropItem } from './DropItem.ts';
import { sound } from '../audio/SoundManager.ts';

export type EnemyType =
  | 'swarmer'
  | 'hover_scout'
  | 'armored_golem'
  | 'crimson_stalker'
  | 'void_phantom';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  maxHp: number;
  damage: number;
  speed: number;
  detectRadius: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  isFlying?: boolean;
  dropTable: { itemId: string; chance: number; count: [number, number] }[];
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  swarmer: {
    type: 'swarmer',
    name: 'Инопланетный роевик',
    maxHp: 40,
    damage: 10,
    speed: 2.4,
    detectRadius: 260,
    width: 22,
    height: 18,
    color: '#10b981',
    glowColor: '#34d399',
    dropTable: [
      { itemId: 'copper_ore', chance: 0.6, count: [1, 2] },
      { itemId: 'cyan_crystal', chance: 0.25, count: [1, 1] },
    ],
  },
  hover_scout: {
    type: 'hover_scout',
    name: 'Летающий био-дрон',
    maxHp: 55,
    damage: 14,
    speed: 2.6,
    detectRadius: 320,
    width: 26,
    height: 22,
    color: '#06b6d4',
    glowColor: '#67e8f9',
    isFlying: true,
    dropTable: [
      { itemId: 'cyan_crystal', chance: 0.7, count: [1, 2] },
      { itemId: 'iron_ore', chance: 0.4, count: [1, 2] },
    ],
  },
  armored_golem: {
    type: 'armored_golem',
    name: 'Бронированный страж недр',
    maxHp: 130,
    damage: 22,
    speed: 1.2,
    detectRadius: 220,
    width: 32,
    height: 38,
    color: '#475569',
    glowColor: '#94a3b8',
    dropTable: [
      { itemId: 'iron_ore', chance: 0.9, count: [2, 4] },
      { itemId: 'stone', chance: 1.0, count: [4, 8] },
    ],
  },
  crimson_stalker: {
    type: 'crimson_stalker',
    name: 'Вулканический хищник',
    maxHp: 180,
    damage: 28,
    speed: 3.2,
    detectRadius: 340,
    width: 30,
    height: 28,
    color: '#dc2626',
    glowColor: '#f97316',
    dropTable: [
      { itemId: 'energy_mineral', chance: 0.8, count: [1, 3] },
      { itemId: 'magma_core', chance: 0.35, count: [1, 1] },
      { itemId: 'titanium_ore', chance: 0.5, count: [1, 2] },
    ],
  },
  void_phantom: {
    type: 'void_phantom',
    name: 'Фантом Бездны',
    maxHp: 260,
    damage: 38,
    speed: 2.8,
    detectRadius: 360,
    width: 28,
    height: 36,
    color: '#7c3aed',
    glowColor: '#c084fc',
    isFlying: true,
    dropTable: [
      { itemId: 'void_crystal', chance: 0.85, count: [1, 3] },
      { itemId: 'astrite_ore', chance: 0.6, count: [1, 2] },
      { itemId: 'dark_matter', chance: 0.3, count: [1, 1] },
    ],
  },
};

export class Enemy {
  public config: EnemyConfig;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public hp: number;
  public maxHp: number;
  public onGround: boolean = false;
  public dead: boolean = false;
  public attackCooldown: number = 0;
  public facing: number = 1; // 1 right, -1 left
  public invulnTime: number = 0;

  constructor(type: EnemyType, x: number, y: number) {
    this.config = ENEMY_CONFIGS[type];
    this.x = x;
    this.y = y;
    this.hp = this.config.maxHp;
    this.maxHp = this.config.maxHp;
  }

  public takeDamage(
    amount: number,
    knockbackX: number,
    knockbackY: number,
    particles: ParticleSystem
  ): boolean {
    if (this.invulnTime > 0) return false;

    this.hp -= amount;
    this.invulnTime = 0.2;
    this.vx = knockbackX;
    this.vy = knockbackY;

    sound.playHurt();
    particles.spawnSparks(
      this.x + this.config.width / 2,
      this.y + this.config.height / 2,
      this.config.glowColor,
      8
    );
    particles.spawnFloatingText(
      this.x + this.config.width / 2,
      this.y - 4,
      `-${Math.round(amount)}`,
      '#f43f5e'
    );

    if (this.hp <= 0) {
      this.dead = true;
      sound.playExplosion();
      particles.spawnSparks(
        this.x + this.config.width / 2,
        this.y + this.config.height / 2,
        this.config.glowColor,
        20
      );
      return true;
    }
    return false;
  }

  public update(
    world: World,
    playerX: number,
    playerY: number,
    projectiles: Projectile[],
    particles: ParticleSystem,
    dt: number
  ) {
    if (this.invulnTime > 0) {
      this.invulnTime -= dt;
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const dx = playerX - (this.x + this.config.width / 2);
    const dy = playerY - (this.y + this.config.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.facing = dx > 0 ? 1 : -1;

    // AI Behavior
    if (dist < this.config.detectRadius) {
      if (this.config.isFlying) {
        // Flying AI: track player in 2D
        const speed = this.config.speed;
        this.vx += (dx / dist) * speed * 0.12;
        this.vy += (dy / dist) * speed * 0.12;
        this.vx *= 0.94;
        this.vy *= 0.94;

        // Ranged attack for void phantom
        if (this.config.type === 'void_phantom' && this.attackCooldown <= 0 && dist > 80) {
          this.attackCooldown = 2.0;
          const pSpeed = 6;
          projectiles.push(
            new Projectile(
              this.x + this.config.width / 2,
              this.y + this.config.height / 2,
              (dx / dist) * pSpeed,
              (dy / dist) * pSpeed,
              22,
              true,
              '#c084fc',
              5
            )
          );
        }
      } else {
        // Ground AI
        const moveDir = dx > 0 ? 1 : -1;
        this.vx = moveDir * this.config.speed;

        // Gravity
        this.vy += 0.45;

        // Jump over obstacles or jump at player
        const aheadTileX = Math.floor((this.x + (moveDir > 0 ? this.config.width + 4 : -4)) / 32);
        const feetTileY = Math.floor((this.y + this.config.height - 2) / 32);
        if (this.onGround && (world.isSolid(aheadTileX, feetTileY) || (dy < -40 && dist < 120))) {
          this.vy = -7.5;
        }

        // Crimson Stalker spit fireball
        if (this.config.type === 'crimson_stalker' && this.attackCooldown <= 0 && dist < 220) {
          this.attackCooldown = 2.8;
          projectiles.push(
            new Projectile(
              this.x + this.config.width / 2,
              this.y + 4,
              (dx / dist) * 7,
              (dy / dist) * 7 - 1,
              18,
              true,
              '#f97316',
              5
            )
          );
        }
      }
    } else {
      // Idle patrol / wander
      if (!this.config.isFlying) {
        this.vy += 0.45;
        this.vx *= 0.8;
      } else {
        this.vx *= 0.95;
        this.vy *= 0.95;
      }
    }

    // Resolve physics
    if (!this.config.isFlying) {
      const res = world.resolvePhysics(
        { x: this.x, y: this.y, width: this.config.width, height: this.config.height },
        this.vx,
        this.vy
      );
      this.x = res.x;
      this.y = res.y;
      this.vx = res.vx;
      this.vy = res.vy;
      this.onGround = res.onGround;
    } else {
      // Gentle flyer collision
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  public getDrops(): DropItem[] {
    const drops: DropItem[] = [];
    for (const rule of this.config.dropTable) {
      if (Math.random() <= rule.chance) {
        const count = Math.floor(
          Math.random() * (rule.count[1] - rule.count[0] + 1) + rule.count[0]
        );
        drops.push(new DropItem(this.x, this.y, rule.itemId, count));
      }
    }
    return drops;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY;

    ctx.save();
    if (this.invulnTime > 0) {
      ctx.globalAlpha = 0.6;
    }

    ctx.fillStyle = this.config.color;
    ctx.shadowColor = this.config.glowColor;
    ctx.shadowBlur = 10;

    if (this.config.type === 'swarmer') {
      // Bug-like crawler
      ctx.beginPath();
      ctx.ellipse(
        sx + this.config.width / 2,
        sy + this.config.height / 2,
        this.config.width / 2,
        this.config.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Glowing eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx + (this.facing > 0 ? 16 : 6), sy + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.config.type === 'hover_scout') {
      // Flying triangular drone
      ctx.beginPath();
      ctx.moveTo(sx + this.config.width / 2, sy);
      ctx.lineTo(sx + this.config.width, sy + this.config.height);
      ctx.lineTo(sx, sy + this.config.height);
      ctx.closePath();
      ctx.fill();
      // Pulsing energy core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx + this.config.width / 2, sy + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.config.type === 'armored_golem') {
      // Heavy blocky mech beast
      ctx.fillRect(sx, sy, this.config.width, this.config.height);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, this.config.width - 2, this.config.height - 2);
      // Red sensor visor
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx + 4, sy + 8, this.config.width - 8, 5);
    } else if (this.config.type === 'crimson_stalker') {
      // Spiky volcanic predator
      ctx.beginPath();
      ctx.moveTo(sx, sy + this.config.height);
      ctx.lineTo(sx + 6, sy + 4);
      ctx.lineTo(sx + this.config.width - 6, sy + 2);
      ctx.lineTo(sx + this.config.width, sy + this.config.height);
      ctx.closePath();
      ctx.fill();
      // Glowing magma eyes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(sx + (this.facing > 0 ? 18 : 6), sy + 8, 5, 4);
    } else {
      // Void phantom
      ctx.beginPath();
      ctx.arc(
        sx + this.config.width / 2,
        sy + 12,
        this.config.width / 2,
        Math.PI,
        0,
        false
      );
      ctx.lineTo(sx + this.config.width, sy + this.config.height);
      ctx.lineTo(sx + this.config.width / 2, sy + this.config.height - 8);
      ctx.lineTo(sx, sy + this.config.height);
      ctx.closePath();
      ctx.fill();
      // Glowing rift eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx + 9, sy + 12, 3, 0, Math.PI * 2);
      ctx.arc(sx + 19, sy + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar above enemy
    if (this.hp < this.maxHp) {
      const barW = this.config.width;
      const barH = 4;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(sx, sy - 8, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx, sy - 8, barW * hpRatio, barH);
    }

    ctx.restore();
  }
}
