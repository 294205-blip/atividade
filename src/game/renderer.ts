import { LevelData } from './level';
import {
  Afterimage,
  BiomeId,
  Checkpoint,
  Collectible,
  Enemy,
  FloatingText,
  Hazard,
  Monolith,
  Particle,
  Platform,
  Player,
  Projectile,
  SceneryProp,
  Shockwave,
  SlashEffect,
} from './types';

interface BiomePalette {
  skyTop: [number, number, number];
  skyBot: [number, number, number];
  farMtn: [number, number, number];
  nearMtn: [number, number, number];
  fog: [number, number, number];
  rayColor: string;
}

const PALETTES: Record<BiomeId, BiomePalette> = {
  forest: {
    skyTop: [4, 7, 11],
    skyBot: [14, 24, 29],
    farMtn: [9, 16, 20],
    nearMtn: [4, 8, 11],
    fog: [38, 62, 66],
    rayColor: 'rgba(165, 195, 210, 0.045)',
  },
  cemetery: {
    skyTop: [5, 7, 13],
    skyBot: [16, 22, 34],
    farMtn: [10, 14, 22],
    nearMtn: [5, 8, 14],
    fog: [46, 60, 78],
    rayColor: 'rgba(176, 198, 228, 0.048)',
  },
  chapel: {
    skyTop: [4, 7, 14],
    skyBot: [16, 23, 36],
    farMtn: [9, 15, 25],
    nearMtn: [5, 9, 15],
    fog: [54, 72, 92],
    rayColor: 'rgba(186, 212, 240, 0.052)',
  },
  asylum: {
    skyTop: [5, 8, 12],
    skyBot: [15, 22, 29],
    farMtn: [10, 16, 23],
    nearMtn: [5, 9, 13],
    fog: [42, 68, 74],
    rayColor: 'rgba(130, 195, 190, 0.045)',
  },
  mansion: {
    skyTop: [7, 5, 8],
    skyBot: [21, 15, 19],
    farMtn: [14, 10, 13],
    nearMtn: [8, 6, 8],
    fog: [62, 46, 48],
    rayColor: 'rgba(206, 184, 154, 0.046)',
  },
  lab: {
    skyTop: [4, 9, 10],
    skyBot: [12, 25, 24],
    farMtn: [8, 18, 18],
    nearMtn: [4, 10, 10],
    fog: [36, 72, 64],
    rayColor: 'rgba(140, 205, 180, 0.042)',
  },
  crypt: {
    skyTop: [7, 4, 6],
    skyBot: [24, 10, 14],
    farMtn: [16, 7, 10],
    nearMtn: [7, 3, 5],
    fog: [85, 24, 28],
    rayColor: 'rgba(210, 90, 75, 0.04)',
  },
};

const BG_PATHS: Record<BiomeId, string> = {
  forest: '/src/assets/images/bg_forest_realistic_1795544064151.jpg',
  cemetery: '/src/assets/images/bg_cemetery_realistic_1795548580024.jpg',
  chapel: '/src/assets/images/bg_chapel_realistic_1795549685277.jpg',
  asylum: '/src/assets/images/bg_asylum_realistic_1795544065629.jpg',
  mansion: '/src/assets/images/bg_mansion_realistic_1795549683898.jpg',
  lab: '/src/assets/images/bg_lab_realistic_1795548580063.jpg',
  crypt: '/src/assets/images/bg_crypt_realistic_1795544065889.jpg',
};

const TEX_PATHS = {
  stone: '/src/assets/images/tex_wet_stone_moss_1795544443838.jpg',
  concrete: '/src/assets/images/tex_asylum_concrete_1795544445377.jpg',
};


export interface RenderContextState {
  level: LevelData;
  player: Player;
  projectiles: Projectile[];
  particles: Particle[];
  afterimages: Afterimage[];
  slashes: SlashEffect[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];
  cameraX: number;
  cameraY: number;
  shakeX: number;
  shakeY: number;
  time: number;
  letterbox: number;
  lightningFlash: number;
  dangerLevel: number;
}

export class CinematicRenderer {
  private ambientMotes: Array<{ x: number; y: number; r: number; speed: number; phase: number }> = [];
  private rainDrops: Array<{ x: number; y: number; len: number; speed: number }> = [];
  private lightCanvas: HTMLCanvasElement | null = null;
  private lightCtx: CanvasRenderingContext2D | null = null;

  // Semi-realistic matte-painted backdrop plates
  private bgImages: Partial<Record<BiomeId, HTMLImageElement>> = {};
  private bgLoaded: Record<BiomeId, boolean> = {
    forest: false,
    cemetery: false,
    chapel: false,
    asylum: false,
    mansion: false,
    lab: false,
    crypt: false,
  };

  // Material patterns (upgraded asynchronously with photorealistic generated tile textures)
  private patterns: Partial<Record<BiomeId, CanvasPattern>> = {};
  private woodPattern: CanvasPattern | null = null;
  private grainCanvas: HTMLCanvasElement | null = null;

  constructor() {
    for (let i = 0; i < 65; i++) {
      this.ambientMotes.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        r: 1 + Math.random() * 2,
        speed: 10 + Math.random() * 22,
        phase: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 120; i++) {
      this.rainDrops.push({
        x: Math.random() * 1700,
        y: Math.random() * 950,
        len: 16 + Math.random() * 24,
        speed: 720 + Math.random() * 300,
      });
    }

    if (typeof window !== 'undefined') {
      (['forest', 'cemetery', 'chapel', 'asylum', 'mansion', 'lab', 'crypt'] as BiomeId[]).forEach((biome) => {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
          this.bgLoaded[biome] = true;
        };
        img.src = BG_PATHS[biome];
        this.bgImages[biome] = img;
      });
      this.initProceduralTextures();
      this.loadPhotorealisticSurfaceTextures();
    }
  }

  private loadPhotorealisticSurfaceTextures(): void {
    const loadScaledPattern = (src: string, size: number, tint: string | null, onReady: (pat: CanvasPattern) => void) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const tctx = c.getContext('2d');
        if (!tctx) return;
        tctx.drawImage(img, 0, 0, size, size);
        // Darken slightly so foreground silhouettes remain legible
        tctx.fillStyle = tint ?? 'rgba(4, 7, 11, 0.36)';
        tctx.fillRect(0, 0, size, size);
        const pat = tctx.createPattern(c, 'repeat');
        if (pat) onReady(pat);
      };
      img.src = src;
    };

    loadScaledPattern(TEX_PATHS.stone, 200, 'rgba(4, 8, 12, 0.34)', (pat) => {
      this.patterns.forest = pat;
    });
    loadScaledPattern(TEX_PATHS.stone, 200, 'rgba(8, 12, 20, 0.38)', (pat) => {
      this.patterns.cemetery = pat;
    });
    loadScaledPattern(TEX_PATHS.stone, 200, 'rgba(10, 16, 26, 0.4)', (pat) => {
      this.patterns.chapel = pat;
    });
    loadScaledPattern(TEX_PATHS.concrete, 200, 'rgba(6, 10, 14, 0.36)', (pat) => {
      this.patterns.asylum = pat;
    });
    loadScaledPattern(TEX_PATHS.concrete, 200, 'rgba(20, 12, 10, 0.44)', (pat) => {
      this.patterns.mansion = pat;
    });
    loadScaledPattern(TEX_PATHS.concrete, 200, 'rgba(6, 16, 14, 0.42)', (pat) => {
      this.patterns.lab = pat;
    });
    loadScaledPattern(TEX_PATHS.stone, 200, 'rgba(26, 6, 10, 0.48)', (pat) => {
      this.patterns.crypt = pat;
    });
  }

  private initProceduralTextures(): void {
    const makeTile = (
      size: number,
      drawFn: (tctx: CanvasRenderingContext2D, s: number) => void
    ): CanvasPattern | null => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const tctx = c.getContext('2d');
      if (!tctx) return null;
      drawFn(tctx, size);
      return tctx.createPattern(c, 'repeat');
    };

    // Immediate fallback textures until photographic textures finish loading
    this.patterns.forest =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#13191b';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;
    this.patterns.cemetery =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#151a22';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;
    this.patterns.chapel =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#161d28';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;
    this.patterns.asylum =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#161e26';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;
    this.patterns.mansion =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#1f1614';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;
    this.patterns.lab =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#131e1d';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;
    this.patterns.crypt =
      makeTile(96, (tctx, s) => {
        tctx.fillStyle = '#1b1115';
        tctx.fillRect(0, 0, s, s);
      }) ?? undefined;

    this.woodPattern = makeTile(48, (tctx, s) => {
      tctx.fillStyle = '#241a13';
      tctx.fillRect(0, 0, s, s);
      tctx.strokeStyle = 'rgba(0,0,0,0.45)';
      tctx.lineWidth = 1;
      for (let y = 4; y < s; y += 6) {
        tctx.beginPath();
        tctx.moveTo(0, y);
        tctx.lineTo(s, y + 1);
        tctx.stroke();
      }
    });

    // Subtle 35mm film grain tile
    const gc = document.createElement('canvas');
    gc.width = 128;
    gc.height = 128;
    const gctx = gc.getContext('2d');
    if (gctx) {
      const imgData = gctx.createImageData(128, 128);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() > 0.5 ? 255 : 0;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 10;
      }
      gctx.putImageData(imgData, 0, 0);
      this.grainCanvas = gc;
    }
  }

  private ensureLightBuffer(vw: number, vh: number): CanvasRenderingContext2D | null {
    if (typeof document === 'undefined') return null;
    const targetW = Math.max(1, Math.floor(vw * 0.5));
    const targetH = Math.max(1, Math.floor(vh * 0.5));
    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement('canvas');
      this.lightCtx = this.lightCanvas.getContext('2d');
    }
    if (this.lightCanvas.width !== targetW || this.lightCanvas.height !== targetH) {
      this.lightCanvas.width = targetW;
      this.lightCanvas.height = targetH;
    }
    return this.lightCtx;
  }

  private drawScrollingMattePlate(
    ctx: CanvasRenderingContext2D,
    biome: BiomeId,
    vw: number,
    vh: number,
    scrollX: number,
    alpha: number
  ): void {
    const img = this.bgImages[biome];
    if (!img || !this.bgLoaded[biome] || alpha <= 0.01) return;

    const imgAspect = img.width / Math.max(1, img.height);
    const drawH = vh;
    const drawW = Math.max(vw, drawH * imgAspect);
    const offset = ((scrollX % (drawW * 2)) + drawW * 2) % (drawW * 2);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Mirrored seamless tiling across the scrolling background
    for (let tile = -1; tile <= 2; tile++) {
      const tx = tile * drawW - offset;
      if (tx + drawW < -20 || tx > vw + 20) continue;
      const mirror = Math.abs(tile) % 2 === 1;
      if (mirror) {
        ctx.save();
        ctx.translate(tx + drawW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, drawW + 2, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(img, tx, 0, drawW + 2, drawH);
      }
    }
    ctx.restore();
  }

  public render(ctx: CanvasRenderingContext2D, vw: number, vh: number, state: RenderContextState): void {
    const { level, player, cameraX, cameraY, shakeX, shakeY, time, letterbox, lightningFlash, dangerLevel } = state;
    const activeBiome = level.biome;
    const pal = PALETTES[activeBiome];
    const skyTop = `rgb(${pal.skyTop[0]}, ${pal.skyTop[1]}, ${pal.skyTop[2]})`;
    const skyBot = `rgb(${pal.skyBot[0]}, ${pal.skyBot[1]}, ${pal.skyBot[2]})`;
    const nearMtn = `rgb(${pal.nearMtn[0]}, ${pal.nearMtn[1]}, ${pal.nearMtn[2]})`;

    ctx.save();

    // 1. Atmospheric Base Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, vh);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vw, vh);

    // 2. Semi-Realistic Parallax Matte-Painted Environment Backdrop
    this.drawScrollingMattePlate(ctx, activeBiome, vw, vh, cameraX * 0.14, 0.72);

    // Depth atmospheric veil so foreground terrain & characters separate cleanly from background art
    const depthVeil = ctx.createLinearGradient(0, 0, 0, vh);
    depthVeil.addColorStop(0, 'rgba(4, 6, 10, 0.35)');
    depthVeil.addColorStop(0.65, 'rgba(6, 9, 14, 0.25)');
    depthVeil.addColorStop(1, 'rgba(4, 6, 10, 0.65)');
    ctx.fillStyle = depthVeil;
    ctx.fillRect(0, 0, vw, vh);

    if (lightningFlash > 0.01) {
      ctx.fillStyle = `rgba(196, 222, 248, ${(lightningFlash * 0.42).toFixed(3)})`;
      ctx.fillRect(0, 0, vw, vh);
    }

    // 3. Near Parallax Silhouette Ridge & Volumetric Light Shafts
    this.drawMountainLayer(ctx, vw, vh, cameraX * 0.26, vh * 0.79, 55, 160, nearMtn, 2.7);
    this.drawGodRays(ctx, vw, vh, cameraX, time, pal.rayColor);

    // Ground Mist Layer
    const mistGrad = ctx.createLinearGradient(0, vh * 0.56, 0, vh);
    mistGrad.addColorStop(0, `rgba(${pal.fog[0]}, ${pal.fog[1]}, ${pal.fog[2]}, 0)`);
    mistGrad.addColorStop(1, `rgba(${pal.fog[0]}, ${pal.fog[1]}, ${pal.fog[2]}, 0.32)`);
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, vh * 0.56, vw, vh * 0.44);

    // ==================== WORLD CAMERA TRANSFORM ====================
    ctx.save();
    const scale = Math.max(1.0, Math.min(1.55, vh / 500));
    ctx.scale(scale, scale);
    const viewW = vw / scale;

    const camOffsetX = -cameraX + shakeX;
    const camOffsetY = -cameraY + shakeY;
    ctx.translate(camOffsetX, camOffsetY);

    // Water / Flooded Basement Zones
    for (const wz of level.waterZones) {
      if (wz.x + wz.w < cameraX - 100 || wz.x > cameraX + viewW + 100) continue;
      this.drawWaterZone(ctx, wz.x, wz.y, wz.w, wz.h, wz.biome, time);
    }

    // Detailed Horror Scenery Props
    for (const prop of level.props) {
      if (prop.x < cameraX - 240 || prop.x > cameraX + viewW + 240) continue;
      this.drawSceneryProp(ctx, prop, time);
    }

    // Diary Monoliths / Notes
    for (const m of level.monoliths) {
      if (m.x < cameraX - 120 || m.x > cameraX + viewW + 120) continue;
      this.drawMonolith(ctx, m, time);
    }

    // Checkpoints (Sanctuary Candles)
    for (const cp of level.checkpoints) {
      if (cp.x < cameraX - 120 || cp.x > cameraX + viewW + 120) continue;
      this.drawCheckpoint(ctx, cp, time);
    }

    // Dawn Exit Gate
    if (level.exitGate.x > cameraX - 260 && level.exitGate.x < cameraX + viewW + 260) {
      this.drawExitGate(ctx, level.exitGate.x, level.exitGate.y, level.exitGate.unlocked, level.exitGate.openProgress, time);
    }

    // Textured Platforms
    for (const p of level.platforms) {
      if (p.x + p.w < cameraX - 100 || p.x > cameraX + viewW + 100) continue;
      this.drawPlatform(ctx, p, time);
    }

    // Hazards
    for (const h of level.hazards) {
      if (h.x + h.w < cameraX - 80 || h.x > cameraX + viewW + 80) continue;
      this.drawHazard(ctx, h, time);
    }

    // Collectibles
    for (const c of level.collectibles) {
      if (c.collected) continue;
      if (c.x < cameraX - 80 || c.x > cameraX + viewW + 80) continue;
      this.drawCollectible(ctx, c, time);
    }

    // Dash Afterimages
    for (const img of state.afterimages) {
      this.drawAfterimage(ctx, img);
    }

    // Horrors / Enemies
    for (const e of level.enemies) {
      if (e.dead && e.deathTimer <= 0) continue;
      if (e.x + e.w < cameraX - 220 || e.x > cameraX + viewW + 220) continue;
      this.drawEnemy(ctx, e, player, time);
    }

    // Articulated Semi-Realistic Player
    this.drawPlayer(ctx, player, time);

    // Projectiles
    for (const proj of state.projectiles) {
      this.drawProjectile(ctx, proj);
    }

    // Steel Slash Arcs
    for (const s of state.slashes) {
      this.drawSlash(ctx, s);
    }

    // Shockwaves
    for (const sw of state.shockwaves) {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.lineWidth;
      ctx.beginPath();
      ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Pooled Particles
    for (const pt of state.particles) {
      if (!pt.active) continue;
      if (pt.x < cameraX - 80 || pt.x > cameraX + viewW + 80) continue;
      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.save();
      if (pt.glow) {
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating Damage / Status Texts
    for (const ft of state.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '600 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore(); // end world transform

    // 4. Foreground Parallax Silhouette Framing (3-Plane Cinematic Depth)
    this.drawForegroundOccluders(ctx, vw, vh, cameraX, activeBiome);

    // 5. Dynamic Horror Darkness Mask + Realistic Lantern Cone & Dust
    this.drawDarknessMask(ctx, vw, vh, scale, cameraX, cameraY, shakeX, shakeY, player, level, time, lightningFlash);

    // 5. Rain, Floating Dust & 35mm Film Grain
    this.drawWeather(ctx, vw, vh, cameraX, time, activeBiome);
    if (this.grainCanvas) {
      ctx.save();
      const pat = ctx.createPattern(this.grainCanvas, 'repeat');
      if (pat) {
        ctx.fillStyle = pat;
        ctx.translate(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64));
        ctx.fillRect(-64, -64, vw + 128, vh + 128);
      }
      ctx.restore();
    }

    // 6. Cinematic Vignette & Heartbeat Danger Pulse
    const vig = ctx.createRadialGradient(vw * 0.5, vh * 0.5, vw * 0.24, vw * 0.5, vh * 0.5, vw * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(2, 3, 6, 0.74)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, vw, vh);

    if (dangerLevel > 0.02) {
      const pulse = (0.5 + 0.5 * Math.sin(time * 7.5)) * dangerLevel;
      const bloodVig = ctx.createRadialGradient(vw * 0.5, vh * 0.5, vw * 0.32, vw * 0.5, vh * 0.5, vw * 0.75);
      bloodVig.addColorStop(0, 'rgba(127, 29, 29, 0)');
      bloodVig.addColorStop(1, `rgba(153, 27, 27, ${(pulse * 0.42).toFixed(3)})`);
      ctx.fillStyle = bloodVig;
      ctx.fillRect(0, 0, vw, vh);
    }

    // 7. Letterbox Bars
    if (letterbox > 0.01) {
      const barH = Math.round(letterbox * Math.min(54, vh * 0.085));
      ctx.fillStyle = '#030407';
      ctx.fillRect(0, 0, vw, barH);
      ctx.fillRect(0, vh - barH, vw, barH);
    }

    ctx.restore();
  }

  private drawForegroundOccluders(
    ctx: CanvasRenderingContext2D,
    vw: number,
    vh: number,
    camX: number,
    biome: BiomeId
  ): void {
    ctx.save();
    const spacing = 780;
    const scrollX = camX * 1.28;
    const startIdx = Math.floor(scrollX / spacing) - 1;
    const count = Math.ceil(vw / spacing) + 3;

    ctx.fillStyle = 'rgba(2, 3, 6, 0.78)';
    for (let i = 0; i < count; i++) {
      const idx = startIdx + i;
      const fx = idx * spacing - scrollX;
      if (biome === 'forest') {
        // Out-of-focus foreground dark pine trunk
        ctx.fillRect(fx, 0, 34, vh);
        ctx.fillStyle = 'rgba(2, 3, 6, 0.45)';
        ctx.fillRect(fx - 8, 0, 50, vh);
        ctx.fillStyle = 'rgba(2, 3, 6, 0.78)';
      } else if (biome === 'cemetery') {
        // Foreground wrought-iron cemetery spire & gnarled trunk
        ctx.fillRect(fx, 0, 22, vh);
        ctx.fillRect(fx + 62, vh * 0.72, 10, vh * 0.28);
      } else if (biome === 'chapel') {
        // Foreground gothic chapel column rib
        ctx.fillRect(fx, 0, 32, vh);
      } else if (biome === 'mansion') {
        // Foreground heavy oak arch frame
        ctx.fillRect(fx, 0, 28, vh);
        ctx.fillRect(0, 0, vw, 18);
      } else if (biome === 'asylum' || biome === 'lab') {
        // Foreground rusted steel doorway pillar / boiler pipe & overhead conduit
        ctx.fillRect(fx, 0, biome === 'lab' ? 30 : 26, vh);
        ctx.fillRect(0, 0, vw, 14);
      } else {
        // Foreground heavy crypt arch rib
        ctx.fillRect(fx, 0, 38, vh);
      }
    }
    ctx.restore();
  }

  private drawDarknessMask(
    ctx: CanvasRenderingContext2D,
    vw: number,
    vh: number,
    scale: number,
    camX: number,
    camY: number,
    shakeX: number,
    shakeY: number,
    player: Player,
    level: LevelData,
    time: number,
    lightningFlash: number
  ): void {
    const lctx = this.ensureLightBuffer(vw, vh);
    if (!lctx || !this.lightCanvas) return;

    const lw = this.lightCanvas.width;
    const lh = this.lightCanvas.height;
    const s = scale * 0.5;
    const darknessAlpha = Math.max(0.16, 0.58 - lightningFlash * 0.42);

    lctx.save();
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = `rgba(3, 4, 8, ${darknessAlpha.toFixed(3)})`;
    lctx.fillRect(0, 0, lw, lh);

    lctx.globalCompositeOperation = 'destination-out';

    const toLX = (wx: number) => (wx - camX + shakeX) * s;
    const toLY = (wy: number) => (wy - camY + shakeY) * s;

    const flicker = 1 + Math.sin(time * 13) * 0.025 + Math.cos(time * 23) * 0.016;
    const px = toLX(player.x + player.w * 0.5 + player.facing * 13);
    const py = toLY(player.y + player.h * 0.44);
    const haloR = (155 + (player.oil / player.maxOil) * 45) * flicker * s;

    const haloGrad = lctx.createRadialGradient(px, py, haloR * 0.14, px, py, haloR);
    haloGrad.addColorStop(0, 'rgba(0,0,0,1)');
    haloGrad.addColorStop(0.55, 'rgba(0,0,0,0.72)');
    haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = haloGrad;
    lctx.beginPath();
    lctx.arc(px, py, haloR, 0, Math.PI * 2);
    lctx.fill();

    // Directional Lantern Beam Cone
    const beamLen = (290 + (player.oil / player.maxOil) * 85) * s;
    const beamSpread = 112 * s;
    const dir = player.facing;
    const beamGrad = lctx.createLinearGradient(px, py, px + dir * beamLen, py);
    beamGrad.addColorStop(0, 'rgba(0,0,0,0.96)');
    beamGrad.addColorStop(0.68, 'rgba(0,0,0,0.48)');
    beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = beamGrad;
    lctx.beginPath();
    lctx.moveTo(px, py - 8 * s);
    lctx.lineTo(px + dir * beamLen, py - beamSpread);
    lctx.lineTo(px + dir * beamLen, py + beamSpread);
    lctx.lineTo(px, py + 8 * s);
    lctx.closePath();
    lctx.fill();

    for (const prop of level.props) {
      if (prop.kind !== 'streetlamp' && prop.kind !== 'flicker_tube' && prop.kind !== 'blood_candle') continue;
      const sx = toLX(prop.x);
      if (sx < -160 || sx > lw + 160) continue;
      if (prop.kind === 'flicker_tube') {
        const flick = Math.sin(time * 19 + prop.x) * Math.sin(time * 7.3 + prop.x);
        if (flick < -0.35) continue;
      }
      const sy = toLY(prop.y - (prop.kind === 'blood_candle' ? 30 : 75));
      const r = (prop.kind === 'blood_candle' ? 105 : 145) * s;
      const g = lctx.createRadialGradient(sx, sy, 4, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,0.92)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(sx, sy, r, 0, Math.PI * 2);
      lctx.fill();
    }

    for (const cp of level.checkpoints) {
      if (!cp.activated) continue;
      const sx = toLX(cp.x);
      const sy = toLY(cp.y - 45);
      const r = 148 * s;
      const g = lctx.createRadialGradient(sx, sy, 6, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,0.95)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(sx, sy, r, 0, Math.PI * 2);
      lctx.fill();
    }

    lctx.restore();
    ctx.drawImage(this.lightCanvas, 0, 0, vw, vh);

    // Warm realistic kerosene bounce light over player & immediate surroundings
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const wpx = (player.x + player.w * 0.5 + player.facing * 13 - camX + shakeX) * scale;
    const wpy = (player.y + player.h * 0.44 - camY + shakeY) * scale;
    const warmGrad = ctx.createRadialGradient(wpx, wpy, 4, wpx, wpy, 175 * scale);
    warmGrad.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
    warmGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.05)');
    warmGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = warmGrad;
    ctx.beginPath();
    ctx.arc(wpx, wpy, 175 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMountainLayer(
    ctx: CanvasRenderingContext2D,
    vw: number,
    vh: number,
    scrollX: number,
    baseY: number,
    amp: number,
    step: number,
    color: string,
    seed: number
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, vh);
    const startIdx = Math.floor(scrollX / step) - 1;
    const count = Math.ceil(vw / step) + 3;
    for (let i = 0; i <= count; i++) {
      const worldIdx = startIdx + i;
      const sx = worldIdx * step - scrollX;
      const h =
        Math.sin(worldIdx * 0.78 * seed) * amp * 0.55 +
        Math.cos(worldIdx * 1.43 + seed) * amp * 0.45;
      ctx.lineTo(sx, baseY - Math.abs(h));
    }
    ctx.lineTo(vw + step, vh);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawGodRays(
    ctx: CanvasRenderingContext2D,
    vw: number,
    vh: number,
    camX: number,
    time: number,
    rayColor: string
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rayColor;
    for (let i = 0; i < 3; i++) {
      const rx =
        (((i * 510 - camX * 0.12 + Math.sin(time * 0.25 + i) * 30) % (vw + 420)) + (vw + 420)) %
          (vw + 420) -
        210;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 100, 0);
      ctx.lineTo(rx + 280, vh);
      ctx.lineTo(rx + 120, vh);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWeather(
    ctx: CanvasRenderingContext2D,
    vw: number,
    vh: number,
    camX: number,
    time: number,
    biome: BiomeId
  ): void {
    ctx.save();
    if (biome === 'forest' || biome === 'cemetery') {
      ctx.strokeStyle = biome === 'cemetery' ? 'rgba(182, 204, 228, 0.24)' : 'rgba(196, 218, 232, 0.26)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const r of this.rainDrops) {
        const sx = ((r.x - camX * 0.75 - time * 150) % vw + vw) % vw;
        const sy = ((r.y + time * r.speed) % vh + vh) % vh;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 5, sy + r.len);
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';
    const moteColor =
      biome === 'crypt'
        ? 'rgba(239, 68, 68, 0.4)'
        : biome === 'mansion'
          ? 'rgba(245, 196, 132, 0.28)'
          : biome === 'lab'
            ? 'rgba(110, 231, 183, 0.24)'
            : biome === 'asylum'
              ? 'rgba(186, 200, 212, 0.3)'
              : biome === 'cemetery' || biome === 'chapel'
                ? 'rgba(191, 219, 254, 0.28)'
                : 'rgba(203, 213, 225, 0.28)';
    for (const m of this.ambientMotes) {
      const sx = ((m.x - camX * 0.5 + Math.sin(time * 0.6 + m.phase) * 24) % vw + vw) % vw;
      const sy = ((m.y - time * m.speed) % vh + vh) % vh;
      ctx.fillStyle = moteColor;
      ctx.beginPath();
      ctx.arc(sx, sy, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWaterZone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    biome: BiomeId,
    time: number
  ): void {
    ctx.save();
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    if (biome === 'asylum') {
      grad.addColorStop(0, 'rgba(14, 34, 44, 0.82)');
      grad.addColorStop(1, 'rgba(3, 7, 10, 0.96)');
    } else if (biome === 'lab') {
      grad.addColorStop(0, 'rgba(12, 40, 34, 0.86)');
      grad.addColorStop(1, 'rgba(3, 9, 8, 0.98)');
    } else if (biome === 'cemetery') {
      grad.addColorStop(0, 'rgba(12, 20, 30, 0.84)');
      grad.addColorStop(1, 'rgba(3, 6, 11, 0.96)');
    } else {
      grad.addColorStop(0, 'rgba(10, 22, 28, 0.82)');
      grad.addColorStop(1, 'rgba(3, 7, 10, 0.96)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Specular water ripples
    ctx.strokeStyle = 'rgba(186, 204, 218, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let wx = x; wx <= x + w; wx += 12) {
      const wy = y + Math.sin(wx * 0.05 + time * 2.4) * 2;
      if (wx === x) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, time: number): void {
    ctx.save();
    if (p.kind === 'bridge') {
      ctx.fillStyle = this.woodPattern ?? '#241a13';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Plank dividers & iron bolts
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      for (let bx = p.x; bx < p.x + p.w; bx += 22) {
        ctx.fillRect(bx, p.y, 2, p.h);
        ctx.fillStyle = '#475569';
        ctx.fillRect(bx + 6, p.y + 4, 2, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
      }
      // Top bevel highlight
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.restore();
      return;
    }

    // Textured Material Pattern Fill + Depth Shadow Gradient
    const pat = this.patterns[p.biome];
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    const shadeGrad = ctx.createLinearGradient(0, p.y, 0, p.y + Math.min(p.h, 140));
    shadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
    shadeGrad.addColorStop(0.18, 'rgba(0, 0, 0, 0.15)');
    shadeGrad.addColorStop(1, 'rgba(3, 5, 8, 0.92)');
    ctx.fillStyle = shadeGrad;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Realistic Top Trim & Specular Wet Edge
    if (p.biome === 'forest' || p.biome === 'cemetery') {
      ctx.fillStyle = p.biome === 'cemetery' ? '#1c2329' : '#1b2620';
      ctx.fillRect(p.x, p.y, p.w, 7);
      // Wet rain specular highlight
      ctx.fillStyle = `rgba(186, 206, 220, ${(0.22 + 0.06 * Math.sin(time * 3)).toFixed(2)})`;
      ctx.fillRect(p.x, p.y, p.w, 1.8);
      // Subtle roots / grass tufts along top
      ctx.fillStyle = p.biome === 'cemetery' ? '#192026' : '#16201a';
      for (let gx = p.x + 12; gx < p.x + p.w - 12; gx += 32) {
        ctx.fillRect(gx, p.y - 3, 2, 4);
        ctx.fillRect(gx + 5, p.y - 2, 2, 3);
      }
    } else if (p.biome === 'chapel') {
      ctx.fillStyle = '#252c38';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = 'rgba(186, 206, 232, 0.28)';
      ctx.fillRect(p.x, p.y, p.w, 1.6);
    } else if (p.biome === 'asylum') {
      ctx.fillStyle = '#2b3540';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.28)';
      ctx.fillRect(p.x, p.y, p.w, 1.6);
    } else if (p.biome === 'mansion') {
      ctx.fillStyle = '#33221a';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = 'rgba(217, 178, 134, 0.24)';
      ctx.fillRect(p.x, p.y, p.w, 1.6);
    } else if (p.biome === 'lab') {
      ctx.fillStyle = '#24322e';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = 'rgba(148, 198, 178, 0.26)';
      ctx.fillRect(p.x, p.y, p.w, 1.6);
    } else {
      ctx.fillStyle = '#31151c';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillStyle = 'rgba(220, 140, 130, 0.25)';
      ctx.fillRect(p.x, p.y, p.w, 1.6);
    }

    // Side drop shadow bevel
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    ctx.restore();
  }

  private drawHazard(ctx: CanvasRenderingContext2D, h: Hazard, time: number): void {
    ctx.save();
    if (h.kind === 'barbed_wire') {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = h.x; x <= h.x + h.w; x += 10) {
        ctx.moveTo(x, h.y + h.h);
        ctx.lineTo(x + 5, h.y + 2);
        ctx.lineTo(x + 10, h.y + h.h);
      }
      ctx.stroke();
      // Wire barbs
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      for (let x = h.x + 5; x < h.x + h.w; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x - 3, h.y + 4);
        ctx.lineTo(x + 3, h.y + 10);
        ctx.stroke();
      }
    } else {
      const spikeW = 12;
      const count = Math.floor(h.w / spikeW);
      for (let i = 0; i < count; i++) {
        const sx = h.x + i * spikeW;
        ctx.beginPath();
        ctx.moveTo(sx, h.y + h.h);
        ctx.lineTo(sx + spikeW * 0.5, h.y - (i % 2 === 0 ? 4 : 1));
        ctx.lineTo(sx + spikeW, h.y + h.h);
        ctx.closePath();

        if (h.kind === 'broken_glass') {
          ctx.fillStyle = '#334155';
          ctx.fill();
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          const pulse = 0.65 + 0.35 * Math.sin(time * 5 + i);
          ctx.fillStyle = '#3a0d0d';
          ctx.fill();
          ctx.strokeStyle = `rgba(220, 38, 38, ${pulse.toFixed(2)})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private drawSceneryProp(ctx: CanvasRenderingContext2D, prop: SceneryProp, time: number): void {
    ctx.save();
    const s = prop.scale ?? 1;
    ctx.translate(prop.x, prop.y);
    ctx.scale(s, s);

    if (prop.kind === 'streetlamp') {
      // Cast-iron fluted post
      const metal = ctx.createLinearGradient(-4, 0, 4, 0);
      metal.addColorStop(0, '#0f141a');
      metal.addColorStop(0.5, '#334155');
      metal.addColorStop(1, '#090c10');
      ctx.fillStyle = metal;
      ctx.fillRect(-5, -16, 10, 16);
      ctx.fillRect(-2.5, -84, 5, 68);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -84);
      ctx.quadraticCurveTo(0, -98, 16, -92);
      ctx.stroke();

      const flick = Math.sin(time * 17 + prop.x) > -0.7 ? 1 : 0.25;
      ctx.fillStyle = `rgba(251, 191, 36, ${flick})`;
      ctx.fillRect(12, -85, 8, 12);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(11, -86, 10, 14);

      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(16, -79, 2, 16, -79, 72);
      g.addColorStop(0, `rgba(245, 158, 11, ${(0.45 * flick).toFixed(2)})`);
      g.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(16, -79, 72, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.kind === 'iron_gate') {
      // Stone gate piers + rusted iron bars
      ctx.fillStyle = '#161b20';
      ctx.fillRect(-56, -118, 16, 118);
      ctx.fillRect(40, -118, 16, 118);
      ctx.strokeStyle = '#27303a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -118, 44, Math.PI, 0);
      ctx.stroke();
      for (let bx = -32; bx <= 32; bx += 16) {
        ctx.fillStyle = '#11161c';
        ctx.fillRect(bx - 1.5, -108, 3, 108);
      }
    } else if (prop.kind === 'dead_tree') {
      const bark = ctx.createLinearGradient(-6, 0, 6, 0);
      bark.addColorStop(0, '#090d10');
      bark.addColorStop(0.5, '#1b2226');
      bark.addColorStop(1, '#070a0c');
      ctx.strokeStyle = bark;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, -98);
      ctx.stroke();
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-3, -62);
      ctx.lineTo(-38, -106);
      ctx.moveTo(-3, -78);
      ctx.lineTo(34, -120);
      ctx.stroke();
    } else if (prop.kind === 'tombstone') {
      const stone = ctx.createLinearGradient(-14, -40, 14, 0);
      stone.addColorStop(0, '#273038');
      stone.addColorStop(1, '#10151a');
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-14, -38);
      ctx.arc(0, -38, 14, Math.PI, 0);
      ctx.lineTo(14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.stroke();
    } else if (prop.kind === 'gurney') {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.strokeRect(-30, -24, 60, 8);
      ctx.beginPath();
      ctx.moveTo(-24, -16);
      ctx.lineTo(-24, -4);
      ctx.moveTo(24, -16);
      ctx.lineTo(24, -4);
      ctx.stroke();
      // Rusty wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-24, -3, 3.5, 0, Math.PI * 2);
      ctx.arc(24, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Torn stained mattress
      ctx.fillStyle = '#334155';
      ctx.fillRect(-28, -29, 56, 6);
    } else if (prop.kind === 'flicker_tube') {
      const flick = Math.sin(time * 19 + prop.x) * Math.sin(time * 7.3 + prop.x);
      const on = flick >= -0.35;
      // Hanging ceiling wires
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-18, -240);
      ctx.lineTo(-18, -155);
      ctx.moveTo(18, -240);
      ctx.lineTo(18, -155);
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-26, -155, 52, 6);
      if (on) {
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(-22, -151, 44, 4);
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, -148, 4, 0, -148, 92);
        g.addColorStop(0, 'rgba(145, 215, 240, 0.28)');
        g.addColorStop(1, 'rgba(145, 215, 240, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, -148, 92, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (prop.kind === 'hanging_chain') {
      const sway = Math.sin(time * 1.9 + prop.x * 0.01) * 6;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, -230);
      ctx.quadraticCurveTo(sway, -120, sway * 1.5, -42);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (prop.kind === 'blood_candle') {
      ctx.fillStyle = '#241418';
      ctx.fillRect(-10, -26, 20, 26);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-3.5, -44, 7, 18);
      const flick = Math.sin(time * 11 + prop.x) * 2.5;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-4, -44);
      ctx.quadraticCurveTo(0, -61 - flick, 4, -44);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -50, 3, 0, -50, 68);
      g.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
      g.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -50, 68, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.kind === 'altar_cross') {
      ctx.fillStyle = '#21131a';
      ctx.fillRect(-5, -92, 10, 92);
      ctx.fillRect(-24, -68, 48, 9);
    }

    ctx.restore();
  }

  private drawMonolith(ctx: CanvasRenderingContext2D, m: Monolith, time: number): void {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-3, -64, 6, 64);
    ctx.fillStyle = '#292018';
    ctx.fillRect(-16, -74, 32, 24);
    ctx.strokeStyle = '#0f0c0a';
    ctx.strokeRect(-16, -74, 32, 24);

    const pulse = m.triggered ? 0.5 : 0.72 + 0.28 * Math.sin(time * 3.2);
    ctx.fillStyle = `rgba(254, 243, 199, ${pulse.toFixed(2)})`;
    ctx.fillRect(-9, -69, 18, 15);
    ctx.restore();
  }

  private drawCheckpoint(ctx: CanvasRenderingContext2D, cp: Checkpoint, time: number): void {
    ctx.save();
    ctx.translate(cp.x, cp.y);

    ctx.fillStyle = '#1c2128';
    ctx.fillRect(-14, -10, 28, 10);
    ctx.fillRect(-4, -54, 8, 44);
    ctx.fillRect(-12, -58, 24, 6);

    const flameColor = cp.activated ? '#fbbf24' : '#475569';
    ctx.fillStyle = flameColor;
    const flick = cp.activated ? Math.sin(time * 9) * 2.5 : 0;
    ctx.beginPath();
    ctx.moveTo(-6, -58);
    ctx.quadraticCurveTo(0, -78 - flick, 6, -58);
    ctx.closePath();
    ctx.fill();

    if (cp.activated) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -64, 4, 0, -64, 78);
      g.addColorStop(0, 'rgba(251, 191, 36, 0.58)');
      g.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -64, 78, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawExitGate(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    unlocked: boolean,
    progress: number,
    time: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#18141c';
    ctx.fillRect(-56, -150, 18, 150);
    ctx.fillRect(38, -150, 18, 150);
    ctx.fillRect(-62, -162, 124, 16);

    if (unlocked || progress > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.55 + 0.25 * Math.sin(time * 3);
      const beam = ctx.createRadialGradient(0, -75, 8, 0, -75, 135);
      beam.addColorStop(0, `rgba(254, 243, 199, ${pulse.toFixed(2)})`);
      beam.addColorStop(0.6, 'rgba(251, 191, 36, 0.28)');
      beam.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.arc(0, -75, 135, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-38, -110);
      ctx.lineTo(38, -50);
      ctx.moveTo(-38, -50);
      ctx.lineTo(38, -110);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible, time: number): void {
    const bob = Math.sin(time * 3 + c.bobOffset) * 5;
    const cx = c.x;
    const cy = c.y + bob;
    const isOil = c.kind === 'oil_flask';

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
    g.addColorStop(0, isOil ? 'rgba(245, 158, 11, 0.55)' : 'rgba(226, 232, 240, 0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    if (isOil) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - 6, cy - 5, 12, 14);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 3, cy - 10, 6, 5);
    } else {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(time * 2 + c.bobOffset) * 0.14);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-7, -9, 14, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, -5, 8, 1.5);
      ctx.fillRect(-4, -1, 8, 1.5);
      ctx.fillRect(-4, 3, 6, 1.5);
      ctx.restore();
    }
    ctx.restore();
  }

  private drawAfterimage(ctx: CanvasRenderingContext2D, img: Afterimage): void {
    ctx.save();
    ctx.globalAlpha = img.alpha * 0.45;
    ctx.fillStyle = img.color;
    ctx.beginPath();
    ctx.roundRect(img.x + 2, img.y + 4, 24, 42, 8);
    ctx.fill();
    ctx.restore();
  }

  private drawSlash(ctx: CanvasRenderingContext2D, s: SlashEffect): void {
    const t = 1 - s.timer / s.duration;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(s.facing, 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, 1 - t * 0.9);

    const startA = s.comboStep === 2 ? -1.4 : -1.0;
    const endA = s.comboStep === 2 ? 1.25 : 0.9;
    const r = s.comboStep === 2 ? 54 : 44;

    ctx.strokeStyle = s.comboStep === 2 ? '#fef08a' : '#e2e8f0';
    ctx.lineWidth = (1 - t) * (s.comboStep === 2 ? 11 : 7);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(6, 0, r, startA, endA);
    ctx.stroke();

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
    if (p.invulnTimer > 0 && Math.floor(time * 22) % 2 === 0 && p.dashTimer <= 0) {
      return;
    }

    // 1. Shaded Verlet Wool Trench-Coat Tail
    ctx.save();
    if (p.coat.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(p.coat[0].x, p.coat[0].y);
      for (let i = 1; i < p.coat.length; i++) {
        ctx.lineTo(p.coat[i].x, p.coat[i].y);
      }
      ctx.strokeStyle = p.hitFlash > 0 ? '#ffffff' : '#181e25';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = p.hitFlash > 0 ? '#ffffff' : '#2d3743';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    // 2. Semi-Realistic Articulated Investigator
    ctx.save();
    const footX = p.x + p.w * 0.5;
    const footY = p.y + p.h;
    ctx.translate(footX, footY);
    ctx.scale(p.facing * p.scaleX, p.scaleY);

    const speedRatio = Math.min(1, Math.abs(p.vx) / 280);
    const lean = p.dashTimer > 0 ? 0.32 : speedRatio * 0.16;
    const breath = Math.sin(time * 3.5) * 1.0;

    // Grounded contact shadow
    if (p.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Articulated two-segment legs with leather boots
    const stride = p.grounded ? Math.sin(p.runCycle) * 10 * speedRatio : 6;
    const kneeLiftA = p.grounded ? Math.max(0, Math.cos(p.runCycle)) * 4 * speedRatio : 4;
    const kneeLiftB = p.grounded ? Math.max(0, -Math.cos(p.runCycle)) * 4 * speedRatio : 2;

    const drawLeg = (hipX: number, footOffset: number, lift: number, shade: string) => {
      const kneeX = hipX + footOffset * 0.5 + 2;
      const kneeY = -10 - lift;
      const fx = hipX + footOffset;
      const fy = -2 - lift * 0.4;
      ctx.strokeStyle = p.hitFlash > 0 ? '#ffffff' : shade;
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, -18);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      // Leather boot
      ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : '#090b0e';
      ctx.fillRect(fx - 2, fy - 2, 7, 4);
    };

    drawLeg(-2, -stride, kneeLiftB, '#11161d');
    drawLeg(2, stride, kneeLiftA, '#1b222c');

    ctx.rotate(lean);

    // Wool Trench Coat Body with warm lantern rim highlight
    const coatGrad = ctx.createLinearGradient(-10, -34, 10, -14);
    coatGrad.addColorStop(0, p.hitFlash > 0 ? '#ffffff' : '#1b222b');
    coatGrad.addColorStop(0.65, p.hitFlash > 0 ? '#ffffff' : '#2a333f');
    coatGrad.addColorStop(1, p.hitFlash > 0 ? '#ffffff' : '#3d444d');
    ctx.fillStyle = coatGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -13);
    ctx.lineTo(-8, -35 + breath);
    ctx.lineTo(8, -35 + breath);
    ctx.lineTo(11, -13);
    ctx.closePath();
    ctx.fill();

    // Coat belt & brass buckle
    ctx.fillStyle = '#0f1318';
    ctx.fillRect(-9, -23 + breath, 18, 3);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(2, -23.5 + breath, 3, 4);

    // Coat collar & profile face shading
    ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : '#94867a';
    ctx.beginPath();
    ctx.arc(2, -41 + breath, 7.2, 0, Math.PI * 2);
    ctx.fill();
    // Face shadow mask under hat
    ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : '#1e1b1a';
    ctx.beginPath();
    ctx.arc(0, -42 + breath, 7.4, Math.PI * 0.7, Math.PI * 2.1);
    ctx.fill();

    // Wet Fedora Hat with specular rim highlight
    ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : '#11151b';
    ctx.fillRect(-11, -46 + breath, 24, 3);
    ctx.fillRect(-7, -53 + breath, 15, 7);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.25)';
    ctx.fillRect(-6, -46 + breath, 16, 1);

    // Front Arm holding weathered brass kerosene lantern
    const swing = Math.sin(p.runCycle) * 0.18 * speedRatio;
    ctx.save();
    ctx.translate(6, -30 + breath);
    ctx.rotate(swing);
    ctx.strokeStyle = p.hitFlash > 0 ? '#ffffff' : '#29323d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 7);
    ctx.lineTo(8, 5);
    ctx.stroke();

    // Brass Lantern Housing + Glass Glow
    ctx.fillStyle = '#78350f';
    ctx.fillRect(5, 5, 8, 2);
    ctx.fillRect(5, 14, 8, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(6, 7, 6, 7);
    ctx.restore();

    ctx.restore();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, player: Player, time: number): void {
    ctx.save();
    if (e.dead) {
      ctx.globalAlpha = Math.max(0, e.deathTimer / 0.35);
    }

    const cx = e.x + e.w * 0.5;
    const cy = e.y + e.h * 0.5;

    if (e.kind === 'crawler') {
      ctx.translate(cx, e.y + e.h);
      ctx.scale(e.facing, 1);

      const twitch = Math.sin(time * 12 + e.animTime) * 1.6;
      const isWindup = e.state === 'windup';

      if (isWindup) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(220, 38, 38, 0.38)';
        ctx.beginPath();
        ctx.arc(0, -22, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Shaded gaunt torso & tattered rags
      const bodyGrad = ctx.createLinearGradient(-16, -40, 14, 0);
      bodyGrad.addColorStop(0, e.hitFlash > 0 ? '#ffffff' : '#0f1013');
      bodyGrad.addColorStop(1, e.hitFlash > 0 ? '#ffffff' : '#2a272a');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-18, -32 + twitch, 4, -40 + twitch);
      ctx.quadraticCurveTo(19, -28 + twitch, 14, 0);
      ctx.closePath();
      ctx.fill();

      // Articulated skeletal forearm & claws
      ctx.strokeStyle = e.hitFlash > 0 ? '#ffffff' : '#52525b';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6, -24 + twitch);
      ctx.lineTo(14, -14);
      ctx.lineTo(19, -3);
      ctx.stroke();

      // Pale gaunt head with sunken eye socket
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(7, -34 + twitch, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(9, -35 + twitch, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isWindup ? '#fef08a' : '#dc2626';
      ctx.fillRect(9, -36 + twitch, 2.5, 2);
    } else if (e.kind === 'wraith') {
      const hover = Math.sin(time * 3.2 + e.animTime) * 6;
      const py = cy + hover;

      if (e.state === 'windup') {
        const tx = player.x + player.w * 0.5;
        const ty = player.y + player.h * 0.45;
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.72)';
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, py - 10);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();
      }

      const shroud = ctx.createLinearGradient(cx, py - 26, cx, py + 24);
      shroud.addColorStop(0, e.hitFlash > 0 ? '#ffffff' : '#1e293b');
      shroud.addColorStop(1, 'rgba(9, 13, 22, 0.2)');
      ctx.fillStyle = shroud;
      ctx.beginPath();
      ctx.moveTo(cx, py - 26);
      ctx.lineTo(cx + 16, py + 18);
      ctx.lineTo(cx + 6, py + 10);
      ctx.lineTo(cx, py + 24);
      ctx.lineTo(cx - 6, py + 10);
      ctx.lineTo(cx - 16, py + 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#cbd5e1';
      ctx.beginPath();
      ctx.arc(cx, py - 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = e.state === 'windup' ? '#fef08a' : '#ef4444';
      ctx.fillRect(cx - 4, py - 16, 2.5, 2.5);
      ctx.fillRect(cx + 1.5, py - 16, 2.5, 2.5);
    } else if (e.kind === 'warden') {
      ctx.translate(cx, e.y + e.h);
      ctx.scale(e.facing, 1);

      const floatY = Math.sin(time * 2.4) * 3;
      const isWindup = e.state === 'windup';

      if (isWindup) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, -4, 68 + Math.sin(time * 18) * 6, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Weathered Leather Executioner Coat
      const wardenGrad = ctx.createLinearGradient(-32, -88, 32, -4);
      wardenGrad.addColorStop(0, e.hitFlash > 0 ? '#ffffff' : '#26171c');
      wardenGrad.addColorStop(1, e.hitFlash > 0 ? '#ffffff' : '#0d0709');
      ctx.fillStyle = wardenGrad;
      ctx.beginPath();
      ctx.moveTo(-36, -4);
      ctx.lineTo(-26, -88 + floatY);
      ctx.lineTo(26, -88 + floatY);
      ctx.lineTo(36, -4);
      ctx.lineTo(14, -14);
      ctx.lineTo(0, -2);
      ctx.lineTo(-14, -14);
      ctx.closePath();
      ctx.fill();

      // Iron Cage Helm with metallic sheen
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#475569';
      ctx.fillRect(-13, -108 + floatY, 26, 24);
      ctx.fillStyle = '#090508';
      ctx.fillRect(-8, -104 + floatY, 16, 16);

      ctx.fillStyle = isWindup ? '#fef08a' : '#ef4444';
      ctx.fillRect(2, -100 + floatY, 6, 3);
      ctx.fillRect(-7, -100 + floatY, 5, 3);
      ctx.beginPath();
      ctx.arc(0, -56 + floatY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Heavy Steel Executioner Cleaver
      ctx.save();
      const cleaverAngle = e.state === 'attack' ? 1.2 : isWindup ? -1.4 : -0.35;
      ctx.translate(22, -62 + floatY);
      ctx.rotate(cleaverAngle);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-3, -68, 12, 72);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(7, -68, 2, 72);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-3, -68, 4, 48);
      ctx.restore();
    }

    if (e.kind !== 'warden' && e.hp < e.maxHp && !e.dead) {
      ctx.restore();
      ctx.save();
      const bw = 34;
      const bx = e.x + e.w * 0.5 - bw * 0.5;
      const by = e.y - 14;
      ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
      ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 5);
    }

    ctx.restore();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, proj.radius * 2.7);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, proj.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius * 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
