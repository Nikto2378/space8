import { WORLD_WIDTH, WORLD_HEIGHT } from '../world/WorldGen.ts';
import { BLOCK_SIZE } from '../world/Blocks.ts';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public width: number = 800;
  public height: number = 600;
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public addShake(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  public update(targetX: number, targetY: number, dt: number) {
    // Smooth lerp to center target in viewport
    const desiredX = targetX - this.width / 2;
    const desiredY = targetY - this.height / 2;

    this.x += (desiredX - this.x) * 0.12;
    this.y += (desiredY - this.y) * 0.12;

    // Apply screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.x += offsetX;
      this.y += offsetY;
    }

    // World clamp
    const maxX = WORLD_WIDTH * BLOCK_SIZE - this.width;
    const maxY = WORLD_HEIGHT * BLOCK_SIZE - this.height;

    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
  }

  public screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: sx + this.x,
      y: sy + this.y,
    };
  }

  public worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx - this.x,
      y: wy - this.y,
    };
  }
}
