import { PlanetId } from '../types.ts';
import { World } from '../world/World.ts';
import { ParticleSystem } from './Particle.ts';
import { Projectile } from './Projectile.ts';
import { Enemy } from './Enemy.ts';
import { DropItem } from './DropItem.ts';
import { sound } from '../audio/SoundManager.ts';

export class Boss {
  public planet: PlanetId;
  public name: string;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number;
  public height: number;
  public hp: number;
  public maxHp: number;
  public phase: number = 1; // 1, 2, 3
  public dead: boolean = false;
  public attackTimer: number = 0;
  public specialAttackTimer: number = 0;
  public invulnTime: number = 0;
  public facing: number = 1;
  public angle: number = 0;
  public shieldActive: boolean = false;

  constructor(planet: PlanetId, spawnX: number, spawnY: number) {
    this.planet = planet;
    this.x = spawnX;
    this.y = spawnY;

    if (planet === 'nova') {
      this.name = 'Древний Страж Ядра';
      this.maxHp = 600;
      this.width = 64;
      this.height = 72;
    } else if (planet === 'ares') {
      this.name = 'Пламенный Левиафан';
      this.maxHp = 1200;
      this.width = 80;
      this.height = 80;
    } else {
      this.name = 'Омега-Оверлорд';
      this.maxHp = 2200;
      this.width = 96;
      this.height = 96;
    }
    this.hp = this.maxHp;
    sound.playBossRoar();
  }

  public takeDamage(
    amount: number,
    particles: ParticleSystem
  ): boolean {
    if (this.invulnTime > 0) return false;
    if (this.shieldActive) {
      amount *= 0.2; // 80% damage reduction when shield is active
      particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, '#38bdf8', 10);
    }

    this.hp -= amount;
    this.invulnTime = 0.15;
    sound.playHurt();

    particles.spawnSparks(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.planet === 'nova' ? '#06b6d4' : this.planet === 'ares' ? '#ef4444' : '#c084fc',
      12
    );
    particles.spawnFloatingText(
      this.x + this.width / 2,
      this.y - 12,
      `-${Math.round(amount)}`,
      '#fbbf24',
      18
    );

    // Phase checks for final boss & ares boss
    const hpRatio = this.hp / this.maxHp;
    if (this.planet === 'void') {
      if (hpRatio <= 0.33 && this.phase < 3) {
        this.phase = 3;
        this.shieldActive = false;
        sound.playBossRoar();
        particles.spawnFloatingText(this.x + this.width / 2, this.y - 30, 'ФАЗА 3: СИНГУЛЯРНОСТЬ!', '#f43f5e', 22);
      } else if (hpRatio <= 0.66 && this.phase < 2) {
        this.phase = 2;
        this.shieldActive = true;
        sound.playBossRoar();
        particles.spawnFloatingText(this.x + this.width / 2, this.y - 30, 'ФАЗА 2: ГИПЕР-ПЕРЕГРУЗКА!', '#a855f7', 20);
      }
    } else if (this.planet === 'ares') {
      if (hpRatio <= 0.5 && this.phase < 2) {
        this.phase = 2;
        sound.playBossRoar();
        particles.spawnFloatingText(this.x + this.width / 2, this.y - 30, 'ЯРОСТЬ ПЛАМЕНИ!', '#f97316', 20);
      }
    }

    if (this.hp <= 0) {
      this.dead = true;
      sound.playExplosion();
      particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, '#ffffff', 40);
      return true;
    }
    return false;
  }

  public update(
    world: World,
    playerX: number,
    playerY: number,
    projectiles: Projectile[],
    enemies: Enemy[],
    particles: ParticleSystem,
    dt: number
  ) {
    if (this.invulnTime > 0) this.invulnTime -= dt;
    this.attackTimer += dt;
    this.specialAttackTimer += dt;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const dx = playerX - centerX;
    const dy = playerY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.facing = dx > 0 ? 1 : -1;

    // Movement & Attack Behaviors
    if (this.planet === 'nova') {
      // Ancient Core Guardian: Heavy hovering monolith
      const targetY = playerY - 70;
      this.vx += (dx / Math.max(1, dist)) * 1.5;
      this.vy += ((targetY - centerY) / Math.max(1, Math.abs(targetY - centerY))) * 1.2;
      this.vx *= 0.92;
      this.vy *= 0.92;

      // Attack 1: Triple energy bolt
      if (this.attackTimer >= 2.2) {
        this.attackTimer = 0;
        sound.playLaser();
        for (let angleOffset of [-0.3, 0, 0.3]) {
          const baseAngle = Math.atan2(dy, dx) + angleOffset;
          const speed = 7;
          projectiles.push(
            new Projectile(
              centerX,
              centerY,
              Math.cos(baseAngle) * speed,
              Math.sin(baseAngle) * speed,
              18,
              true,
              '#06b6d4',
              6
            )
          );
        }
      }

      // Attack 2: Ground Slam shockwave
      if (this.specialAttackTimer >= 7.0) {
        this.specialAttackTimer = 0;
        this.vy = 12; // Slam down!
        particles.spawnSparks(centerX, centerY + 30, '#67e8f9', 24);
        particles.spawnFloatingText(centerX, centerY - 20, 'УДАРНАЯ ВОЛНА!', '#38bdf8', 16);

        // Ground burst
        for (let i = -3; i <= 3; i++) {
          projectiles.push(
            new Projectile(centerX + i * 20, centerY + 20, i * 3, -4, 15, true, '#38bdf8', 5)
          );
        }
      }
    } else if (this.planet === 'ares') {
      // Flame Leviathan: Fast serpentine dashes and fire summons
      const speed = this.phase === 2 ? 3.8 : 2.6;
      this.vx += (dx / Math.max(1, dist)) * speed * 0.15;
      this.vy += (dy / Math.max(1, dist)) * speed * 0.15;
      this.vx *= 0.94;
      this.vy *= 0.94;

      // Attack 1: Radial fire spray
      if (this.attackTimer >= (this.phase === 2 ? 1.6 : 2.4)) {
        this.attackTimer = 0;
        sound.playLaser();
        const count = this.phase === 2 ? 8 : 5;
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count;
          projectiles.push(
            new Projectile(centerX, centerY, Math.cos(ang) * 6, Math.sin(ang) * 6, 22, true, '#f97316', 6)
          );
        }
      }

      // Attack 2: Summon volcanic swarmers & dash attack
      if (this.specialAttackTimer >= 8.0) {
        this.specialAttackTimer = 0;
        sound.playBossRoar();
        particles.spawnFloatingText(centerX, centerY - 20, 'ПРИЗЫВ ЛАВОВЫХ ТВАРИЙ!', '#ef4444', 16);

        // Summon 2 adds
        if (enemies.length < 10) {
          enemies.push(new Enemy('swarmer', centerX - 40, centerY));
          enemies.push(new Enemy('swarmer', centerX + 40, centerY));
        }

        // Fast dash toward player
        this.vx = (dx / Math.max(1, dist)) * 14;
        this.vy = (dy / Math.max(1, dist)) * 14;
      }
    } else {
      // Omega Overlord (Void Final Boss)
      if (this.phase === 1) {
        // Phase 1: Heavy laser barrage & dark matter orbs
        this.vx += (dx / Math.max(1, dist)) * 2.2;
        this.vy += (dy / Math.max(1, dist)) * 1.8;
        this.vx *= 0.91;
        this.vy *= 0.91;

        if (this.attackTimer >= 2.0) {
          this.attackTimer = 0;
          sound.playLaser();
          for (let i = -2; i <= 2; i++) {
            const angle = Math.atan2(dy, dx) + i * 0.2;
            projectiles.push(
              new Projectile(centerX, centerY, Math.cos(angle) * 8, Math.sin(angle) * 8, 28, true, '#c084fc', 6)
            );
          }
        }
      } else if (this.phase === 2) {
        // Phase 2: Hyper-speed dashes + shield + split beams
        this.vx += (dx / Math.max(1, dist)) * 3.6;
        this.vy += (dy / Math.max(1, dist)) * 3.0;
        this.vx *= 0.93;
        this.vy *= 0.93;

        if (this.attackTimer >= 1.5) {
          this.attackTimer = 0;
          sound.playLaser();
          for (let i = 0; i < 6; i++) {
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
            projectiles.push(
              new Projectile(centerX, centerY, Math.cos(angle) * 9, Math.sin(angle) * 9, 32, true, '#a855f7', 7)
            );
          }
        }
      } else {
        // Phase 3: Singularity Vortex & Minion Storm!
        // Pull player toward boss
        const pullStrength = 1.2;
        if (dist > 30) {
          playerX -= (dx / dist) * pullStrength;
        }

        this.vx += (dx / Math.max(1, dist)) * 4.5;
        this.vy += (dy / Math.max(1, dist)) * 4.0;
        this.vx *= 0.92;
        this.vy *= 0.92;

        if (this.attackTimer >= 1.2) {
          this.attackTimer = 0;
          sound.playLaser();
          // Spiral barrage
          const now = Date.now() * 0.005;
          for (let i = 0; i < 8; i++) {
            const angle = now + (Math.PI * 2 * i) / 8;
            projectiles.push(
              new Projectile(centerX, centerY, Math.cos(angle) * 8, Math.sin(angle) * 8, 35, true, '#ec4899', 7)
            );
          }
        }

        // Special: Minion reinforcements
        if (this.specialAttackTimer >= 9.0) {
          this.specialAttackTimer = 0;
          sound.playBossRoar();
          particles.spawnFloatingText(centerX, centerY - 20, 'РАЗРЫВ ПУСТОТЫ!', '#c084fc', 20);
          if (enemies.length < 8) {
            enemies.push(new Enemy('void_phantom', centerX - 60, centerY));
            enemies.push(new Enemy('void_phantom', centerX + 60, centerY));
          }
        }
      }
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  public getDrops(): DropItem[] {
    const drops: DropItem[] = [];
    if (this.planet === 'nova') {
      // Must drop warp drive!
      drops.push(new DropItem(this.x + this.width / 2, this.y, 'warp_drive', 1));
      drops.push(new DropItem(this.x, this.y, 'cyan_crystal', 10));
      drops.push(new DropItem(this.x + 20, this.y, 'iron_ore', 15));
    } else if (this.planet === 'ares') {
      // Must drop hyper core!
      drops.push(new DropItem(this.x + this.width / 2, this.y, 'hyper_core', 1));
      drops.push(new DropItem(this.x, this.y, 'magma_core', 6));
      drops.push(new DropItem(this.x + 20, this.y, 'energy_mineral', 12));
      drops.push(new DropItem(this.x - 20, this.y, 'titanium_ore', 14));
    } else {
      // Final boss drop
      drops.push(new DropItem(this.x + this.width / 2, this.y, 'void_heart', 1));
      drops.push(new DropItem(this.x, this.y, 'dark_matter', 10));
      drops.push(new DropItem(this.x + 20, this.y, 'astrite_ore', 20));
      drops.push(new DropItem(this.x - 20, this.y, 'void_crystal', 16));
    }
    return drops;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY;
    const cx = sx + this.width / 2;
    const cy = sy + this.height / 2;

    ctx.save();
    if (this.invulnTime > 0) ctx.globalAlpha = 0.7;

    if (this.planet === 'nova') {
      // Ancient Core Guardian: Geometric robotic colossus
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;

      // Hexagonal outer chassis
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i;
        const px = cx + Math.cos(ang) * (this.width / 2);
        const py = cy + Math.sin(ang) * (this.height / 2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing pulsating core
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.planet === 'ares') {
      // Flame Leviathan: Winged magma dragon/beast
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;

      // Main body
      ctx.beginPath();
      ctx.ellipse(cx, cy, this.width / 2, this.height / 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fiery spikes / wings
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 20);
      ctx.lineTo(cx - 55, cy - 50);
      ctx.lineTo(cx - 15, cy - 30);
      ctx.moveTo(cx + 30, cy - 20);
      ctx.lineTo(cx + 55, cy - 50);
      ctx.lineTo(cx + 15, cy - 30);
      ctx.fill();

      // Burning eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + (this.facing > 0 ? 14 : -24), cy - 8, 12, 6);
    } else {
      // Omega Overlord: Eldritch Void God
      ctx.shadowColor = this.phase === 3 ? '#ec4899' : '#a855f7';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = this.phase === 3 ? '#f43f5e' : '#c084fc';
      ctx.lineWidth = 4;

      // Black singularity orb
      ctx.beginPath();
      ctx.arc(cx, cy, this.width / 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orbiting void tendrils
      const t = Date.now() * 0.004;
      for (let i = 0; i < 4; i++) {
        const ang = t + (Math.PI / 2) * i;
        const tx = cx + Math.cos(ang) * 44;
        const ty = cy + Math.sin(ang) * 44;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(tx, ty, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eye of the Void
      ctx.fillStyle = this.phase === 3 ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Phase 2/3 Shield effect
      if (this.shieldActive) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, this.width / 2 + 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
