import { InventoryItem, Equipment, PlayerStats } from '../types.ts';
import { World } from '../world/World.ts';
import { ParticleSystem } from './Particle.ts';
import { Projectile } from './Projectile.ts';
import { ITEMS } from '../items/ItemDefinitions.ts';
import { sound } from '../audio/SoundManager.ts';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 22;
  public height: number = 44;

  public hp: number = 100;
  public maxHp: number = 100;
  public energy: number = 100;
  public maxEnergy: number = 100;

  public onGround: boolean = false;
  public facing: number = 1; // 1 right, -1 left
  public isMoving: boolean = false;
  public walkCycle: number = 0;

  public invulnTime: number = 0;
  public attackCooldown: number = 0;
  public swingAngle: number = 0;
  public isSwinging: boolean = false;

  public jetpackActive: boolean = false;
  public dead: boolean = false;

  // Active Drink Buffs
  public speedBuffTime: number = 0;
  public defenseBuffTime: number = 0;
  public shieldHp: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public getStats(equipment: Equipment): PlayerStats {
    let hpBonus = 0;
    let def = 2;
    let speedBonus = 0;
    let miningPower = 1.0;
    let damageBonus = 0;

    // Armor bonuses
    if (equipment.armor) {
      const defItem = ITEMS[equipment.armor.id];
      if (defItem) {
        hpBonus += defItem.healAmount || 0;
        def += defItem.defense || 0;
        speedBonus += defItem.speedBonus || 0;
      }
    }

    // Booster bonuses
    if (equipment.booster) {
      const bItem = ITEMS[equipment.booster.id];
      if (bItem && bItem.speedBonus) {
        speedBonus += bItem.speedBonus;
      }
    }

    // Tool power
    if (equipment.tool) {
      const tItem = ITEMS[equipment.tool.id];
      if (tItem && tItem.miningPower) {
        miningPower = tItem.miningPower;
      }
    }

    // Active drink buffs
    if (this.speedBuffTime > 0) {
      speedBonus += 0.35;
    }
    if (this.defenseBuffTime > 0) {
      def += 12;
    }

    return {
      hp: this.hp,
      maxHp: 100 + hpBonus,
      energy: this.energy,
      maxEnergy: 100,
      defense: def,
      miningPower,
      damage: 10 + damageBonus,
      speed: 4.2 * (1 + speedBonus),
    };
  }

  public takeDamage(amount: number, particles: ParticleSystem, stats: PlayerStats) {
    if (this.invulnTime > 0 || this.dead) return;

    // Apply defense reduction (at least 20% damage always penetrates)
    const reducedDamage = Math.max(Math.round(amount * 0.2), Math.round(amount - stats.defense * 0.6));
    
    // Check absorbed shield damage
    let finalDamage = reducedDamage;
    if (this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, reducedDamage);
      this.shieldHp -= absorbed;
      finalDamage = reducedDamage - absorbed;
      particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, '#38bdf8', 12);
      particles.spawnFloatingText(
        this.x + this.width / 2,
        this.y - 12,
        `ЩИТ -${absorbed}`,
        '#38bdf8',
        14
      );
    }

    if (finalDamage > 0) {
      this.hp -= finalDamage;
      sound.playHurt();
      particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, '#ef4444', 10);
      particles.spawnFloatingText(
        this.x + this.width / 2,
        this.y - 10,
        `-${finalDamage}`,
        '#ef4444',
        16
      );
    }

    this.invulnTime = 0.5;

    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      sound.playExplosion();
      particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, '#38bdf8', 30);
    }
  }

  public respawn(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.dead = false;
    this.invulnTime = 1.0;
    this.speedBuffTime = 0;
    this.defenseBuffTime = 0;
    this.shieldHp = 0;
  }

  public update(
    world: World,
    keys: Record<string, boolean>,
    particles: ParticleSystem,
    stats: PlayerStats,
    equipment: Equipment,
    dt: number
  ) {
    if (this.dead) return;

    if (this.invulnTime > 0) this.invulnTime -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Active drink buffs countdown
    if (this.speedBuffTime > 0) this.speedBuffTime = Math.max(0, this.speedBuffTime - dt);
    if (this.defenseBuffTime > 0) this.defenseBuffTime = Math.max(0, this.defenseBuffTime - dt);

    // Natural energy recharge
    if (this.energy < this.maxEnergy && !this.jetpackActive) {
      this.energy = Math.min(this.maxEnergy, this.energy + 25 * dt);
    }

    // Horizontal Movement
    let moveX = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    if (moveX !== 0) {
      this.vx = moveX * stats.speed;
      this.facing = moveX;
      this.isMoving = true;
      if (this.onGround) {
        this.walkCycle += dt * 14;
      }
    } else {
      this.vx *= 0.72; // friction
      this.isMoving = false;
      this.walkCycle = 0;
    }

    // Jumping & Jetpack
    const wantsJump = keys['KeyW'] || keys['ArrowUp'] || keys['Space'];
    this.jetpackActive = false;

    if (wantsJump) {
      if (this.onGround) {
        this.vy = -8.2;
        this.onGround = false;
        sound.playJump();
      } else if (equipment.booster && this.energy > 4) {
        // Jetpack thrust
        this.jetpackActive = true;
        const thrust = equipment.booster.id === 'jetpack_mk2' ? -10.5 : -7.5;
        this.vy = Math.max(thrust, this.vy - 1.2);
        this.energy -= 20 * dt;
        sound.playJetpack();
        particles.spawnThrusterFlame(
          this.x + (this.facing > 0 ? 3 : this.width - 3),
          this.y + this.height - 10
        );
      }
    }

    // Gravity
    const gravity = world.planet === 'void' ? 0.35 : world.planet === 'ares' ? 0.46 : 0.5;
    this.vy += gravity;

    // Terminal velocity
    if (this.vy > 14) this.vy = 14;

    // Resolve physics
    const res = world.resolvePhysics(
      { x: this.x, y: this.y, width: this.width, height: this.height },
      this.vx,
      this.vy
    );
    this.x = res.x;
    this.y = res.y;
    this.vx = res.vx;
    this.vy = res.vy;
    this.onGround = res.onGround;

    // Weapon Swing animation update
    if (this.isSwinging) {
      this.swingAngle += dt * 18;
      if (this.swingAngle >= Math.PI) {
        this.isSwinging = false;
        this.swingAngle = 0;
      }
    }
  }

  public swingWeapon() {
    this.isSwinging = true;
    this.swingAngle = -Math.PI / 4;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    mouseAngle: number,
    selectedItem: InventoryItem | null,
    equipment: Equipment
  ) {
    if (this.dead) return;

    const sx = this.x - cameraX;
    const sy = this.y - cameraY;

    ctx.save();
    if (this.invulnTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Energy Shield Bubble Effect from drinks
    if (this.shieldHp > 0) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.beginPath();
      ctx.ellipse(sx + 11, sy + 22, 19, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Speed Buff Aura from drinks
    if (this.speedBuffTime > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx + 11, sy + 22, 16, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Leg animation
    const legOffset = this.isMoving ? Math.sin(this.walkCycle) * 6 : 0;

    // Suit Colors depending on equipped armor
    let suitColor = '#e2e8f0'; // Clean white starter suit
    let trimColor = '#0ea5e9'; // Cyan accents
    if (equipment.armor?.id === 'suit_scout') {
      suitColor = '#0284c7';
      trimColor = '#38bdf8';
    } else if (equipment.armor?.id === 'suit_hazard') {
      suitColor = '#c2410c';
      trimColor = '#f97316';
    } else if (equipment.armor?.id === 'suit_void') {
      suitColor = '#1e1b4b';
      trimColor = '#c084fc';
    }

    // Legs
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx + 3, sy + 30 + legOffset, 6, 14);
    ctx.fillRect(sx + 13, sy + 30 - legOffset, 6, 14);

    // Torso / Jetpack Backpack
    ctx.fillStyle = '#475569';
    const packX = this.facing > 0 ? sx - 3 : sx + this.width - 3;
    ctx.fillRect(packX, sy + 14, 6, 16);

    // Main Torso
    ctx.fillStyle = suitColor;
    ctx.fillRect(sx + 3, sy + 12, 16, 20);

    // Armor Chest Emblem
    ctx.fillStyle = trimColor;
    ctx.fillRect(sx + 7, sy + 16, 8, 4);

    // Helmet
    ctx.fillStyle = suitColor;
    ctx.beginPath();
    ctx.arc(sx + 11, sy + 8, 10, 0, Math.PI * 2);
    ctx.fill();

    // Visor with Glowing Cyan reflection
    ctx.save();
    const visorX = this.facing > 0 ? sx + 11 : sx + 3;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(visorX + 3, sy + 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hand / Tool / Weapon Rendering
    const handX = sx + (this.facing > 0 ? 15 : 7);
    const handY = sy + 22;

    ctx.save();
    ctx.translate(handX, handY);

    if (this.isSwinging) {
      // Swing arc animation
      const angle = this.facing > 0 ? this.swingAngle : -this.swingAngle;
      ctx.rotate(angle);
    } else {
      // Aim weapon towards mouse cursor
      ctx.rotate(this.facing > 0 ? mouseAngle : mouseAngle - Math.PI);
    }

    // Render in-hand item (blade, blaster, or drill)
    if (selectedItem) {
      const itemDef = ITEMS[selectedItem.id];
      if (itemDef) {
        if (itemDef.category === 'weapon') {
          if (itemDef.isRanged) {
            // Blaster Gun
            ctx.fillStyle = itemDef.iconColor;
            ctx.fillRect(0, -3, 14, 6);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(2, 2, 4, 6);
          } else {
            // Plasma Sword / Blade
            ctx.fillStyle = itemDef.iconColor;
            ctx.shadowColor = itemDef.iconColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(24, 0);
            ctx.lineTo(0, 2);
            ctx.closePath();
            ctx.fill();
            // Sword hilt
            ctx.fillStyle = '#475569';
            ctx.fillRect(-4, -4, 4, 8);
          }
        } else if (itemDef.category === 'tool') {
          // Drill / Pickaxe
          ctx.fillStyle = itemDef.iconColor;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(16, -10);
          ctx.lineTo(18, -4);
          ctx.lineTo(6, 6);
          ctx.closePath();
          ctx.fill();
        } else if (itemDef.category === 'block') {
          // Mini block in hand
          ctx.fillStyle = itemDef.iconColor;
          ctx.fillRect(4, -6, 10, 10);
        }
      }
    }

    ctx.restore();
    ctx.restore();
  }
}
