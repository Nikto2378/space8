import { ITEMS } from '../items/ItemDefinitions.ts';
import { World } from '../world/World.ts';

export class DropItem {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = -2;
  public itemId: string;
  public count: number;
  public life: number = 0;
  public maxLife: number = 300; // 5 minutes
  public size: number = 18;

  constructor(x: number, y: number, itemId: string, count: number = 1) {
    this.x = x;
    this.y = y;
    this.itemId = itemId;
    this.count = count;
    this.vx = (Math.random() - 0.5) * 2;
  }

  public update(world: World, playerX: number, playerY: number, dt: number) {
    this.life += dt;

    // Magnet to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < 110 * 110) {
      const dist = Math.sqrt(distSq);
      if (dist > 1) {
        const pull = 6;
        this.vx += (dx / dist) * pull;
        this.vy += (dy / dist) * pull;
      }
    } else {
      // Natural gravity
      this.vy += 0.25;
      this.vx *= 0.92;
      this.vy *= 0.96;

      // Collide with ground
      const res = world.resolvePhysics(
        { x: this.x, y: this.y, width: this.size, height: this.size },
        this.vx,
        this.vy
      );
      this.x = res.x;
      this.y = res.y;
      this.vx = res.vx;
      this.vy = res.vy;
      return;
    }

    this.x += this.vx * 0.4;
    this.y += this.vy * 0.4;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY + Math.sin(this.life * 4) * 3;
    const itemDef = ITEMS[this.itemId];
    const color = itemDef ? itemDef.iconColor : '#38bdf8';

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;

    // Glowing diamond/crate
    ctx.beginPath();
    ctx.moveTo(sx + 9, sy);
    ctx.lineTo(sx + 18, sy + 9);
    ctx.lineTo(sx + 9, sy + 18);
    ctx.lineTo(sx, sy + 9);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx + 9, sy + 9, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
