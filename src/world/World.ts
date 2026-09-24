import { BlockType, PlanetId } from '../types.ts';
import { BLOCK_DEFS, BLOCK_SIZE } from './Blocks.ts';
import { PLANETS } from './Planets.ts';
import { generatePlanetWorld, WORLD_WIDTH, WORLD_HEIGHT } from './WorldGen.ts';
import { ITEMS } from '../items/ItemDefinitions.ts';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class World {
  public planet: PlanetId;
  public tiles: Uint8Array;
  public width: number = WORLD_WIDTH;
  public height: number = WORLD_HEIGHT;

  public spawnX: number;
  public spawnY: number;
  public shipX: number;
  public shipY: number;
  public bossAltarX: number;
  public bossAltarY: number;
  public bossSpawned: boolean = false;

  // Track damaged blocks: key "x,y" -> current damage 0..1
  public blockDamage: Map<string, { current: number; max: number }> = new Map();

  // Custom starry background cache
  private stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];

  constructor(planet: PlanetId, savedModifications?: Record<string, number>) {
    this.planet = planet;
    const generated = generatePlanetWorld(planet);
    this.tiles = generated.tiles;
    this.spawnX = generated.spawnX;
    this.spawnY = generated.spawnY;
    this.shipX = generated.shipX;
    this.shipY = generated.shipY;
    this.bossAltarX = generated.bossAltarX;
    this.bossAltarY = generated.bossAltarY;

    // Apply any saved modifications
    if (savedModifications) {
      for (const [key, type] of Object.entries(savedModifications)) {
        const [xStr, yStr] = key.split(',');
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        if (!isNaN(x) && !isNaN(y)) {
          this.setTile(x, y, type as BlockType);
        }
      }
    }

    // Generate parallax stars
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 800,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.15 + 0.05,
      });
    }
  }

  public getTile(x: number, y: number): BlockType {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return BlockType.STONE; // Border bounds
    }
    return this.tiles[y * this.width + x];
  }

  public setTile(x: number, y: number, type: BlockType) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y * this.width + x] = type;
      this.blockDamage.delete(`${x},${y}`);
    }
  }

  public getBlockDef(x: number, y: number) {
    return BLOCK_DEFS[this.getTile(x, y)] || BLOCK_DEFS[BlockType.AIR];
  }

  public isSolid(x: number, y: number): boolean {
    return this.getBlockDef(x, y).solid;
  }

  public damageBlock(
    tileX: number,
    tileY: number,
    amount: number
  ): { destroyed: boolean; dropItem?: string; dropCount?: number } {
    const tileType = this.getTile(tileX, tileY);
    if (tileType === BlockType.AIR || tileType === BlockType.SPACESHIP_HULL) {
      return { destroyed: false };
    }

    const def = BLOCK_DEFS[tileType];
    const key = `${tileX},${tileY}`;
    const cur = this.blockDamage.get(key) || { current: 0, max: def.hardness * 10 };

    cur.current += amount;
    if (cur.current >= cur.max) {
      // Destroy block
      this.setTile(tileX, tileY, BlockType.AIR);
      this.blockDamage.delete(key);

      const dropId = def.dropItem;
      let count = 1;
      if (def.dropCount) {
        count = Math.floor(
          Math.random() * (def.dropCount[1] - def.dropCount[0] + 1) + def.dropCount[0]
        );
      }
      return { destroyed: true, dropItem: dropId, dropCount: count };
    } else {
      this.blockDamage.set(key, cur);
      return { destroyed: false };
    }
  }

  public canPlaceBlock(
    tileX: number,
    tileY: number,
    playerBox: BoundingBox
  ): boolean {
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return false;
    // Must be air currently
    if (this.getTile(tileX, tileY) !== BlockType.AIR) return false;

    // Must not overlap player
    const blockBox = {
      x: tileX * BLOCK_SIZE,
      y: tileY * BLOCK_SIZE,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    };
    const overlaps =
      playerBox.x < blockBox.x + blockBox.width &&
      playerBox.x + playerBox.width > blockBox.x &&
      playerBox.y < blockBox.y + blockBox.height &&
      playerBox.y + playerBox.height > blockBox.y;

    if (overlaps) return false;

    // Must have at least one neighbor or be near ground/wall
    const hasNeighbor =
      this.getTile(tileX - 1, tileY) !== BlockType.AIR ||
      this.getTile(tileX + 1, tileY) !== BlockType.AIR ||
      this.getTile(tileX, tileY - 1) !== BlockType.AIR ||
      this.getTile(tileX, tileY + 1) !== BlockType.AIR;

    return hasNeighbor;
  }

  // --- Collision Resolution for Entities ---
  public resolvePhysics(
    box: BoundingBox,
    vx: number,
    vy: number
  ): {
    x: number;
    y: number;
    vx: number;
    vy: number;
    onGround: boolean;
    hitWall: boolean;
    hitCeiling: boolean;
  } {
    let newX = box.x;
    let newY = box.y;
    let newVx = vx;
    let newVy = vy;
    let onGround = false;
    let hitWall = false;
    let hitCeiling = false;

    // 1. Move X and check tile collisions
    newX += newVx;
    const startTileX = Math.floor(newX / BLOCK_SIZE);
    const endTileX = Math.floor((newX + box.width - 0.01) / BLOCK_SIZE);
    const startTileY = Math.floor(newY / BLOCK_SIZE);
    const endTileY = Math.floor((newY + box.height - 0.01) / BLOCK_SIZE);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const def = this.getBlockDef(tx, ty);
        if (def.solid) {
          hitWall = true;
          if (newVx > 0) {
            newX = tx * BLOCK_SIZE - box.width;
          } else if (newVx < 0) {
            newX = (tx + 1) * BLOCK_SIZE;
          }
          newVx = 0;
          break;
        }
      }
    }

    // 2. Move Y and check tile collisions
    newY += newVy;
    const checkStartTileX = Math.floor(newX / BLOCK_SIZE);
    const checkEndTileX = Math.floor((newX + box.width - 0.01) / BLOCK_SIZE);
    const newStartTileY = Math.floor(newY / BLOCK_SIZE);
    const newEndTileY = Math.floor((newY + box.height - 0.01) / BLOCK_SIZE);

    for (let ty = newStartTileY; ty <= newEndTileY; ty++) {
      for (let tx = checkStartTileX; tx <= checkEndTileX; tx++) {
        const def = this.getBlockDef(tx, ty);
        if (def.solid) {
          if (newVy > 0) {
            newY = ty * BLOCK_SIZE - box.height;
            onGround = true;
          } else if (newVy < 0) {
            newY = (ty + 1) * BLOCK_SIZE;
            hitCeiling = true;
          }
          newVy = 0;
          break;
        } else if (def.isPlatform && newVy > 0) {
          // Semi-solid platform check: only collide if feet were above platform top previously
          const prevFeetY = box.y + box.height;
          const platformTop = ty * BLOCK_SIZE;
          if (prevFeetY <= platformTop + 4 && newY + box.height >= platformTop) {
            newY = platformTop - box.height;
            newVy = 0;
            onGround = true;
            break;
          }
        }
      }
    }

    return {
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      onGround,
      hitWall,
      hitCeiling,
    };
  }

  // --- Rendering ---
  public renderBackground(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number
  ) {
    const config = PLANETS[this.planet];

    // Sky Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, viewH);
    grad.addColorStop(0, config.skyGradient[0]);
    grad.addColorStop(0.5, config.skyGradient[1]);
    grad.addColorStop(1, config.skyGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Stars Parallax
    ctx.fillStyle = '#ffffff';
    for (const star of this.stars) {
      const sx = (star.x - cameraX * star.speed) % viewW;
      const drawX = sx < 0 ? sx + viewW : sx;
      const sy = (star.y - cameraY * star.speed * 0.5) % (viewH * 0.8);
      const drawY = sy < 0 ? sy + viewH * 0.8 : sy;

      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Distant Celestial Bodies
    const moonX = (viewW * 0.7 - cameraX * 0.02) % viewW;
    const moonY = viewH * 0.22 - cameraY * 0.02;

    if (this.planet === 'nova') {
      // Twin cyan rings & glowing moon
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 44, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 30;
      ctx.fill();
      // Planetary ring
      ctx.beginPath();
      ctx.ellipse(moonX, moonY, 90, 18, -0.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.45)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    } else if (this.planet === 'ares') {
      // Crimson giant gas planet in the sky
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 68, 0, Math.PI * 2);
      const cGrad = ctx.createRadialGradient(moonX - 20, moonY - 20, 10, moonX, moonY, 68);
      cGrad.addColorStop(0, '#fca5a5');
      cGrad.addColorStop(0.6, '#dc2626');
      cGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = cGrad;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.restore();
    } else {
      // Cosmic black hole / void singularity in sky
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#050014';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 50;
      ctx.fill();

      // Accretion disk
      ctx.beginPath();
      ctx.ellipse(moonX, moonY, 110, 24, 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }

    // Distant mountain silhouettes (Layer 1 & Layer 2)
    this.renderMountainLayer(ctx, cameraX * 0.1, viewH, 0.28, config.themeColor, 0.15);
    this.renderMountainLayer(ctx, cameraX * 0.22, viewH, 0.42, config.surfaceColor, 0.3);
  }

  private renderMountainLayer(
    ctx: CanvasRenderingContext2D,
    offset: number,
    viewH: number,
    heightScale: number,
    color: string,
    alpha: number
  ) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, viewH);

    const step = 80;
    for (let x = 0; x <= ctx.canvas.width + step; x += step) {
      const worldX = x + offset;
      const peak = Math.sin(worldX * 0.005) * 80 + Math.sin(worldX * 0.012) * 40;
      const y = viewH - (viewH * heightScale + peak);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(ctx.canvas.width, viewH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  public renderWorldTiles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number
  ) {
    const minTx = Math.max(0, Math.floor(cameraX / BLOCK_SIZE));
    const maxTx = Math.min(this.width - 1, Math.ceil((cameraX + viewW) / BLOCK_SIZE));
    const minTy = Math.max(0, Math.floor(cameraY / BLOCK_SIZE));
    const maxTy = Math.min(this.height - 1, Math.ceil((cameraY + viewH) / BLOCK_SIZE));

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const type = this.getTile(tx, ty);
        if (type === BlockType.AIR) continue;

        const def = BLOCK_DEFS[type];
        const screenX = tx * BLOCK_SIZE - cameraX;
        const screenY = ty * BLOCK_SIZE - cameraY;

        ctx.fillStyle = def.color;
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);

        // Tech edge / borders
        if (def.edgeColor) {
          ctx.strokeStyle = def.edgeColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 0.5, screenY + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }

        // Texture accents
        if (type === BlockType.GRASS) {
          // Lush cyber-spores top edge
          ctx.fillStyle = '#34d399';
          ctx.fillRect(screenX, screenY, BLOCK_SIZE, 4);
        } else if (type === BlockType.CYAN_CRYSTAL || type === BlockType.VOID_CRYSTAL || type === BlockType.ENERGY_MINERAL) {
          // Glowing inner facet
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(screenX + 8, screenY + 16);
          ctx.lineTo(screenX + 16, screenY + 6);
          ctx.lineTo(screenX + 24, screenY + 16);
          ctx.lineTo(screenX + 16, screenY + 26);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (type === BlockType.COPPER_ORE || type === BlockType.IRON_ORE || type === BlockType.TITANIUM_ORE || type === BlockType.ASTRITE_ORE) {
          // Ore specks
          ctx.fillStyle = def.edgeColor || '#ffffff';
          ctx.fillRect(screenX + 6, screenY + 8, 5, 5);
          ctx.fillRect(screenX + 18, screenY + 14, 6, 6);
          ctx.fillRect(screenX + 10, screenY + 22, 5, 4);
        } else if (type === BlockType.LADDER) {
          // Ladder rungs
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(screenX + 4, screenY + 8);
          ctx.lineTo(screenX + BLOCK_SIZE - 4, screenY + 8);
          ctx.moveTo(screenX + 4, screenY + 16);
          ctx.lineTo(screenX + BLOCK_SIZE - 4, screenY + 16);
          ctx.moveTo(screenX + 4, screenY + 24);
          ctx.lineTo(screenX + BLOCK_SIZE - 4, screenY + 24);
          ctx.stroke();
        } else if (type === BlockType.NEON_LIGHT) {
          // Super bright core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX + 6, screenY + 6, BLOCK_SIZE - 12, BLOCK_SIZE - 12);
        }

        // Render block breaking cracks
        const dmg = this.blockDamage.get(`${tx},${ty}`);
        if (dmg && dmg.current > 0) {
          const ratio = Math.min(1, dmg.current / dmg.max);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const cx = screenX + BLOCK_SIZE / 2;
          const cy = screenY + BLOCK_SIZE / 2;
          const extent = (BLOCK_SIZE / 2) * ratio;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - extent, cy - extent);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + extent, cy - extent * 0.7);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - extent * 0.8, cy + extent);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + extent, cy + extent * 0.9);
          ctx.stroke();
        }
      }
    }

    // Render Spaceship on Landing Pad
    this.renderSpaceship(ctx, cameraX, cameraY);

    // Render Boss Summoning Altar
    this.renderBossAltar(ctx, cameraX, cameraY);
  }

  private renderSpaceship(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const sx = this.shipX - cameraX;
    const sy = this.shipY - cameraY;

    ctx.save();
    // Spaceship Hull
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    // Streamlined exploration shuttle
    ctx.beginPath();
    ctx.moveTo(sx + 20, sy + 60);
    ctx.lineTo(sx + 60, sy + 15);
    ctx.lineTo(sx + 140, sy + 15);
    ctx.lineTo(sx + 180, sy + 60);
    ctx.lineTo(sx + 150, sy + 80);
    ctx.lineTo(sx + 40, sy + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Canopy (Glowing Cyan Glass)
    ctx.beginPath();
    ctx.moveTo(sx + 90, sy + 18);
    ctx.lineTo(sx + 130, sy + 18);
    ctx.lineTo(sx + 145, sy + 45);
    ctx.lineTo(sx + 85, sy + 45);
    ctx.closePath();
    const glassGrad = ctx.createLinearGradient(sx + 90, sy + 18, sx + 90, sy + 45);
    glassGrad.addColorStop(0, '#38bdf8');
    glassGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.stroke();

    // Thruster engine glow
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.fillRect(sx + 24, sy + 50, 16, 22);

    // Landing gear struts
    ctx.fillStyle = '#475569';
    ctx.fillRect(sx + 50, sy + 80, 10, 16);
    ctx.fillRect(sx + 130, sy + 80, 10, 16);

    // Ship Name / Decal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('ODYSSEY-IX', sx + 62, sy + 64);

    // Interactivity Hint
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('🚀 [E] КОСМИЧЕСКИЙ КОРАБЛЬ', sx + 15, sy - 10);

    ctx.restore();
  }

  private renderBossAltar(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const ax = this.bossAltarX - cameraX;
    const ay = this.bossAltarY - cameraY;

    ctx.save();
    // Altar pedestal
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 28, ay + 32);
    ctx.lineTo(ax - 18, ay);
    ctx.lineTo(ax + 18, ay);
    ctx.lineTo(ax + 28, ay + 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floating pulsing crystal relic
    const time = Date.now() * 0.003;
    const hoverY = ay - 24 + Math.sin(time) * 6;

    ctx.fillStyle = this.planet === 'nova' ? '#06b6d4' : this.planet === 'ares' ? '#ef4444' : '#a855f7';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(ax, hoverY - 14);
    ctx.lineTo(ax + 12, hoverY);
    ctx.lineTo(ax, hoverY + 14);
    ctx.lineTo(ax - 12, hoverY);
    ctx.closePath();
    ctx.fill();

    // Prompt banner
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚠️ АЛТАРЬ БОССА: [E] ПРИЗВАТЬ', ax, ay - 42);
    ctx.restore();
  }
}
