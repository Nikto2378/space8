import { World } from '../world/World.ts';
import { ParticleSystem } from './Particle.ts';

export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public damage: number;
  public isEnemy: boolean;
  public color: string;
  public radius: number;
  public life: number = 0;
  public maxLife: number = 2.5; // seconds
  public dead: boolean = false;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    isEnemy: boolean = false,
    color: string = '#38bdf8',
    radius: number = 4
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isEnemy = isEnemy;
    this.color = color;
    this.radius = radius;
  }

  public update(world: World, particles: ParticleSystem, dt: number) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.dead = true;
      return;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Check collision with solid tiles
    const tileX = Math.floor(this.x / 32);
    const tileY = Math.floor(this.y / 32);

    if (world.isSolid(tileX, tileY)) {
      this.dead = true;
      particles.spawnSparks(this.x, this.y, this.color, 6);
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Laser trail
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - this.vx * 1.5, sy - this.vy * 1.5);
    ctx.stroke();

    ctx.restore();
  }
}
