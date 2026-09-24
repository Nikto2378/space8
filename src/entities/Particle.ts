export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  glow?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size?: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) {
        p.vy += p.gravity;
      }
      p.alpha = 1 - p.life / p.maxLife;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life += dt;
      if (t.life >= t.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y -= 0.8;
      t.alpha = 1 - t.life / t.maxLife;
    }
  }

  public spawnSparks(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.3 + 0.2,
        gravity: 0.1,
        glow: true,
      });
    }
  }

  public spawnThrusterFlame(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() * 4 - 2),
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 3.5 + 2,
      color: Math.random() > 0.5 ? '#38bdf8' : '#67e8f9',
      alpha: 0.9,
      life: 0,
      maxLife: 0.2,
      glow: true,
    });
  }

  public spawnDebris(x: number, y: number, color: string, count: number = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.3,
        gravity: 0.25,
      });
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string, size: number = 14) {
    this.floatingTexts.push({
      x: x + (Math.random() * 12 - 6),
      y,
      text,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.8,
      size,
    });
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    ctx.save();
    for (const p of this.particles) {
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(sx, sy, p.size, p.size);
    }
    ctx.restore();

    // Render texts
    ctx.save();
    for (const t of this.floatingTexts) {
      const sx = t.x - cameraX;
      const sy = t.y - cameraY;
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size || 14}px sans-serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, sx, sy);
    }
    ctx.restore();
  }
}
