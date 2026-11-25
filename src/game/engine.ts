import { SoundEngine } from './audio';
import { LevelData, STAGES, createStageLevel } from './level';
import { CinematicRenderer } from './renderer';
import {
  Afterimage,
  BiomeId,
  CoatNode,
  Enemy,
  FloatingText,
  GamePhase,
  HudSnapshot,
  InputState,
  Particle,
  Player,
  Projectile,
  Shockwave,
  SlashEffect,
} from './types';

const GRAVITY = 1950;
const MOVE_SPEED = 310;
const JUMP_VEL = -695;
const DOUBLE_JUMP_VEL = -635;
const DASH_SPEED = 690;
const DASH_DUR = 0.18;

export class HorrorAdventureEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer = new CinematicRenderer();
  public sound = new SoundEngine();

  private level: LevelData;
  private player: Player;
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private afterimages: Afterimage[] = [];
  private slashes: SlashEffect[] = [];
  private shockwaves: Shockwave[] = [];
  private floatingTexts: FloatingText[] = [];

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedTime = 0;
  private playSeconds = 0;

  private phase: GamePhase = 'TITLE';
  private cameraX = 0;
  private cameraY = 90;
  private shakeTrauma = 0;
  private hitstopTimer = 0;
  private letterbox = 0;

  // Storm lightning, footsteps & breath
  private lightningTimer = 6.5;
  private lightningFlash = 0;
  private heartbeatTimer = 0;
  private lastStepIndex = 0;
  private breathTimer = 2.4;
  private healCooldown = 0;

  // Stats & narrative
  private pagesCollected = 0;
  private totalPages = 0;
  private enemiesBanished = 0;
  private deaths = 0;
  private currentStageIndex = 0;
  private currentBiome: BiomeId = 'forest';
  private chapterBannerTimer = 0;
  private subtitleTitle: string | null = null;
  private subtitleText: string | null = null;
  private subtitleTimer = 0;
  private checkpointNotice: string | null = null;
  private checkpointNoticeTimer = 0;
  private bossAwakened = false;

  // Input state
  private keysHeld = new Set<string>();
  private touchHeld = {
    left: false,
    right: false,
  };
  private queuedActions = {
    jump: false,
    jumpHeld: false,
    attack: false,
    dash: false,
    flare: false,
    heal: false,
  };

  private onHudUpdate: (hud: HudSnapshot) => void;
  private onPhaseChange: (phase: GamePhase) => void;
  private onStageCleared?: (stageIndex: number) => void;
  private lastHudPush = 0;
  private resizeObserver: ResizeObserver | null = null;
  private logicalW = 1280;
  private logicalH = 720;

  constructor(
    canvas: HTMLCanvasElement,
    onHudUpdate: (hud: HudSnapshot) => void,
    onPhaseChange: (phase: GamePhase) => void,
    onStageCleared?: (stageIndex: number) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = ctx;
    this.onHudUpdate = onHudUpdate;
    this.onPhaseChange = onPhaseChange;
    this.onStageCleared = onStageCleared;

    for (let i = 0; i < 160; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        gravity: 0,
        glow: false,
      });
    }

    this.level = createStageLevel(0);
    this.currentBiome = this.level.biome;
    this.totalPages = this.level.collectibles.filter((c) => c.kind === 'diary_page').length;
    const startY = (this.level.platforms[0]?.y ?? 540) - 54;
    this.player = this.createPlayer(110, startY);
    this.bindEvents();
    this.handleResize();
    this.startLoop();
  }

  private createPlayer(x: number, y: number): Player {
    const coat: CoatNode[] = [];
    for (let i = 0; i < 6; i++) {
      coat.push({ x: x - i * 6, y: y + 18 + i * 2, prevX: x - i * 6, prevY: y + 18 + i * 2 });
    }
    return {
      x,
      y,
      w: 28,
      h: 50,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsLeft: 2,
      dashTimer: 0,
      dashCooldown: 0,
      attackTimer: 0,
      attackCooldown: 0,
      comboStep: 0,
      comboResetTimer: 0,
      flareCooldown: 0,
      invulnTimer: 0,
      hitFlash: 0,
      hp: 5,
      maxHp: 5,
      oil: 100,
      maxOil: 100,
      scaleX: 1,
      scaleY: 1,
      runCycle: 0,
      animTime: 0,
      spawnX: x,
      spawnY: y,
      coat,
    };
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    this.resizeObserver?.disconnect();
    this.sound.setAmbientActive(false);
  }

  private handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect?.width ?? window.innerWidth));
    const h = Math.max(240, Math.floor(rect?.height ?? window.innerHeight));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.logicalW = w;
    this.logicalH = h;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private handleWindowBlur = (): void => {
    this.keysHeld.clear();
    this.touchHeld.left = false;
    this.touchHeld.right = false;
    this.queuedActions.jumpHeld = false;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (
      ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)
    ) {
      e.preventDefault();
    }

    if (code === 'Escape') {
      if (this.phase === 'PLAYING') {
        this.pauseGame();
      } else if (this.phase === 'PAUSED') {
        this.resumeGame();
      }
      return;
    }

    if (this.phase !== 'PLAYING') return;

    const firstPress = !this.keysHeld.has(code);
    this.keysHeld.add(code);

    if (firstPress) {
      if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
        this.queuedActions.jump = true;
        this.queuedActions.jumpHeld = true;
      }
      if (code === 'KeyJ' || code === 'KeyZ') {
        this.queuedActions.attack = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyL' || code === 'KeyC') {
        this.queuedActions.dash = true;
      }
      if (code === 'KeyK' || code === 'KeyX') {
        this.queuedActions.flare = true;
      }
      if (code === 'KeyE' || code === 'KeyQ') {
        this.queuedActions.heal = true;
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      const stillHeld =
        this.keysHeld.has('Space') || this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp');
      this.queuedActions.jumpHeld = stillHeld;
    }
  };

  // Virtual Touch Control API
  public setTouchDirection(dir: 'left' | 'right', active: boolean): void {
    this.touchHeld[dir] = active;
  }

  public triggerTouchAction(action: 'jump' | 'attack' | 'dash' | 'flare' | 'heal', pressed: boolean): void {
    this.sound.unlock();
    if (action === 'jump') {
      if (pressed) this.queuedActions.jump = true;
      this.queuedActions.jumpHeld = pressed;
    } else if (pressed) {
      this.queuedActions[action] = true;
    }
  }

  public startStage(stageIndex: number): void {
    const idx = Math.max(0, Math.min(STAGES.length - 1, stageIndex));
    this.currentStageIndex = idx;

    this.sound.unlock();
    this.sound.playUiClick();

    this.level = createStageLevel(idx);
    this.currentBiome = this.level.biome;
    const rainLevel =
      this.currentBiome === 'forest' || this.currentBiome === 'cemetery'
        ? 1.0
        : this.currentBiome === 'chapel' ||
            this.currentBiome === 'asylum' ||
            this.currentBiome === 'mansion' ||
            this.currentBiome === 'lab'
          ? 0.35
          : 0.0;
    this.sound.setAmbientActive(true, rainLevel);

    this.totalPages = this.level.collectibles.filter((c) => c.kind === 'diary_page').length;
    const startY = (this.level.platforms[0]?.y ?? 540) - 54;
    this.player = this.createPlayer(110, startY);
    this.projectiles = [];
    this.afterimages = [];
    this.slashes = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    for (const p of this.particles) p.active = false;

    this.playSeconds = 0;
    this.pagesCollected = 0;
    this.enemiesBanished = 0;
    this.deaths = 0;
    this.chapterBannerTimer = 3.2;
    this.subtitleTitle = null;
    this.subtitleText = null;
    this.subtitleTimer = 0;
    this.checkpointNotice = null;
    this.bossAwakened = false;
    this.cameraX = 0;
    this.cameraY = Math.max(20, startY - 385);
    this.shakeTrauma = 0;
    this.hitstopTimer = 0;
    this.healCooldown = 0;

    this.setPhase('PLAYING');
    this.pushHudSnapshot(true);
  }

  public startNewGame(): void {
    this.startStage(0);
  }

  public restartStage(): void {
    this.startStage(this.currentStageIndex);
  }

  public nextStage(): void {
    if (this.currentStageIndex < STAGES.length - 1) {
      this.startStage(this.currentStageIndex + 1);
    } else {
      this.startStage(0);
    }
  }

  public pauseGame(): void {
    if (this.phase !== 'PLAYING') return;
    this.sound.playUiClick();
    this.sound.setAmbientActive(false);
    this.setPhase('PAUSED');
  }

  public resumeGame(): void {
    if (this.phase !== 'PAUSED') return;
    this.sound.playUiClick();
    this.sound.setAmbientActive(true);
    this.lastTimestamp = performance.now();
    this.setPhase('PLAYING');
  }

  public returnToTitle(): void {
    this.sound.playUiClick();
    this.sound.setAmbientActive(false);
    this.setPhase('TITLE');
  }

  public respawnAtLastCheckpoint(): void {
    this.sound.unlock();
    this.sound.playUiClick();
    this.sound.setAmbientActive(true);

    const p = this.player;
    p.x = p.spawnX;
    p.y = p.spawnY;
    p.vx = 0;
    p.vy = 0;
    p.hp = p.maxHp;
    p.oil = p.maxOil;
    p.invulnTimer = 1.4;
    p.hitFlash = 0;
    p.dashTimer = 0;
    p.dashCooldown = 0;
    p.attackTimer = 0;
    p.attackCooldown = 0;
    p.flareCooldown = 0;
    this.healCooldown = 0;

    // Restore monsters' health and state back to normal on death/respawn
    const freshLevel = createStageLevel(this.currentStageIndex);
    this.level.enemies = freshLevel.enemies.map((fresh) => {
      const existing = this.level.enemies.find((e) => e.id === fresh.id);
      // Keep monsters far behind an already-passed checkpoint dead if they were defeated,
      // while resetting all active/ahead monsters (including the boss) to full HP and initial state.
      if (existing && existing.dead && fresh.patrolMaxX < p.spawnX - 150) {
        return existing;
      }
      return fresh;
    });

    const warden = this.level.enemies.find((e) => e.kind === 'warden');
    if (warden && !warden.dead) {
      this.bossAwakened = false;
      this.level.exitGate.unlocked = freshLevel.exitGate.unlocked;
      this.level.exitGate.openProgress = 0;
      this.subtitleTitle = null;
      this.subtitleText = null;
      this.subtitleTimer = 0;
    }

    this.projectiles = [];
    this.slashes = [];
    this.shockwaves = [];
    this.afterimages = [];
    this.floatingTexts = [];
    this.resetCoatPosition();
    this.setPhase('PLAYING');
    this.pushHudSnapshot(true);
  }

  private setPhase(next: GamePhase): void {
    this.phase = next;
    this.onPhaseChange(next);
  }

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.elapsedTime += dt;

      if (this.phase === 'PLAYING') {
        this.updateSimulation(dt);
      } else {
        // Gentle idle camera pan on title/overlay
        this.updateTitleBackground(dt);
      }

      this.renderFrame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private updateTitleBackground(dt: number): void {
    this.cameraX = 180 + Math.sin(this.elapsedTime * 0.14) * 140;
    this.cameraY = 95;
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.5);
  }

  private consumeInput(): InputState {
    const left =
      this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') || this.touchHeld.left;
    const right =
      this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') || this.touchHeld.right;
    const up = this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp');
    const down = this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown');

    const input: InputState = {
      left,
      right,
      up,
      down,
      jumpHeld: this.queuedActions.jumpHeld,
      jumpJustPressed: this.queuedActions.jump,
      attackJustPressed: this.queuedActions.attack,
      dashJustPressed: this.queuedActions.dash,
      flareJustPressed: this.queuedActions.flare,
      healJustPressed: this.queuedActions.heal,
    };

    this.queuedActions.jump = false;
    this.queuedActions.attack = false;
    this.queuedActions.dash = false;
    this.queuedActions.flare = false;
    this.queuedActions.heal = false;
    return input;
  }

  private updateSimulation(dt: number): void {
    this.playSeconds += dt;

    // Hitstop freeze frame for weighty combat impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.5);
      return;
    }

    // Periodic Storm Lightning in Outdoor / Upper Asylum Biomes
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.8);
    if (
      this.currentBiome === 'forest' ||
      this.currentBiome === 'cemetery' ||
      this.currentBiome === 'chapel' ||
      this.currentBiome === 'asylum' ||
      this.currentBiome === 'mansion'
    ) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 9 + Math.random() * 11;
        this.lightningFlash = 0.95;
        this.sound.playThunder();
      }
    }

    const input = this.consumeInput();
    this.updatePlayer(dt, input);
    this.updateCoatPhysics(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateWorldInteractions(dt);
    this.updateVfx(dt);
    this.updateCamera(dt);

    // Cold night breath condensation puff
    this.breathTimer -= dt;
    if (this.breathTimer <= 0) {
      this.breathTimer = this.player.hp <= 2 ? 1.45 : 2.7;
      const bx = this.player.x + this.player.w * 0.5 + this.player.facing * 8;
      const by = this.player.y + 11;
      this.spawnBurst(bx, by, 'rgba(203, 213, 225, 0.55)', 2, 22, false);
    }

    // Heartbeat tension when low HP or boss active
    const danger = this.getDangerLevel();
    if (danger > 0.4) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = danger > 0.8 ? 0.72 : 1.05;
        this.sound.playHeartbeat();
      }
    }

    // Timers
    if (this.chapterBannerTimer > 0) this.chapterBannerTimer = Math.max(0, this.chapterBannerTimer - dt);
    if (this.subtitleTimer > 0) {
      this.subtitleTimer = Math.max(0, this.subtitleTimer - dt);
      if (this.subtitleTimer === 0) {
        this.subtitleText = null;
        this.subtitleTitle = null;
      }
    }
    if (this.checkpointNoticeTimer > 0) {
      this.checkpointNoticeTimer = Math.max(0, this.checkpointNoticeTimer - dt);
      if (this.checkpointNoticeTimer === 0) this.checkpointNotice = null;
    }

    // Smooth cinematic letterbox during story beats / chapter banners
    const wantLetterbox = this.subtitleText || this.chapterBannerTimer > 0.4 ? 1 : 0;
    this.letterbox += (wantLetterbox - this.letterbox) * Math.min(1, dt * 6);

    if (this.elapsedTime - this.lastHudPush > 0.08) {
      this.pushHudSnapshot(false);
    }
  }

  private updatePlayer(dt: number, input: InputState): void {
    const p = this.player;
    p.animTime += dt;
    p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.comboResetTimer = Math.max(0, p.comboResetTimer - dt);
    p.flareCooldown = Math.max(0, p.flareCooldown - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    this.healCooldown = Math.max(0, this.healCooldown - dt);

    // Infinite lantern oil: always at 100% brightness
    p.oil = p.maxOil;

    p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
    p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

    if (input.jumpJustPressed) {
      p.jumpBufferTimer = 0.13;
    }

    // Dash / Dodge
    if (input.dashJustPressed && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashTimer = DASH_DUR;
      p.dashCooldown = 0.55;
      p.invulnTimer = Math.max(p.invulnTimer, DASH_DUR + 0.06);
      p.vx = p.facing * DASH_SPEED;
      p.vy = 0;
      p.scaleX = 1.25;
      p.scaleY = 0.78;
      this.sound.playDash();
      this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.6, '#94a3b8', 8, 120, false);
    }

    // Heal with lantern warmth (cooldown-based since lantern is infinite)
    if (input.healJustPressed && p.hp < p.maxHp && this.healCooldown <= 0) {
      this.healCooldown = 4.0;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.sound.playHeal();
      this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, '#fbbf24', 14, 150, true);
      this.addFloatingText(p.x + p.w * 0.5, p.y - 10, '+1 VITALIDADE', '#fde047');
      this.pushHudSnapshot(true);
    }

    // Lantern Flare Pulse (infinite lantern — free on cooldown)
    if (input.flareJustPressed && p.flareCooldown <= 0) {
      p.flareCooldown = 0.9;
      this.sound.playFlare();
      this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.32);
      const cx = p.x + p.w * 0.5;
      const cy = p.y + p.h * 0.5;
      this.shockwaves.push({
        x: cx,
        y: cy,
        radius: 16,
        maxRadius: 175,
        alpha: 0.95,
        color: '#fde047',
        lineWidth: 5,
      });
      this.spawnBurst(cx, cy, '#fef08a', 20, 260, true);

      // Damage & stun nearby horrors
      for (const e of this.level.enemies) {
        if (e.dead || e.state === 'dormant') continue;
        const ex = e.x + e.w * 0.5;
        const ey = e.y + e.h * 0.5;
        if (Math.hypot(ex - cx, ey - cy) < 175) {
          this.damageEnemy(e, 2, ex < cx ? -1 : 1, true);
        }
      }
      // Dispel enemy projectiles
      this.projectiles = this.projectiles.filter((proj) => {
        if (!proj.fromPlayer && Math.hypot(proj.x - cx, proj.y - cy) < 180) {
          this.spawnBurst(proj.x, proj.y, '#fef08a', 6, 120, true);
          return false;
        }
        return true;
      });
      this.pushHudSnapshot(true);
    }

    // Melee Strike (Knife / Crowbar)
    if (input.attackJustPressed && p.attackCooldown <= 0) {
      if (p.comboResetTimer <= 0) p.comboStep = 0;
      p.comboStep = (p.comboStep % 3) + 1;
      p.comboResetTimer = 0.55;
      p.attackTimer = 0.16;
      p.attackCooldown = p.comboStep === 3 ? 0.34 : 0.21;
      this.sound.playSlash(p.comboStep);

      const sx = p.x + p.w * 0.5 + p.facing * 26;
      const sy = p.y + p.h * 0.45;
      this.slashes.push({
        x: p.x + p.w * 0.5,
        y: sy,
        facing: p.facing,
        comboStep: p.comboStep,
        timer: 0.16,
        duration: 0.16,
      });

      const reachW = p.comboStep === 3 ? 72 : 58;
      const hitBoxX = p.facing === 1 ? p.x + p.w * 0.5 : p.x + p.w * 0.5 - reachW;
      const hitBoxY = p.y - 6;
      const hitBoxH = p.h + 14;

      let landedHit = false;
      for (const e of this.level.enemies) {
        if (e.dead || e.state === 'dormant') continue;
        if (
          e.x < hitBoxX + reachW &&
          e.x + e.w > hitBoxX &&
          e.y < hitBoxY + hitBoxH &&
          e.y + e.h > hitBoxY
        ) {
          const dmg = p.comboStep === 3 ? 2 : 1;
          this.damageEnemy(e, dmg, p.facing, p.comboStep === 3);
          landedHit = true;
        }
      }

      // Deflect enemy projectiles
      for (const proj of this.projectiles) {
        if (proj.fromPlayer) continue;
        if (
          proj.x + proj.radius > hitBoxX &&
          proj.x - proj.radius < hitBoxX + reachW &&
          proj.y + proj.radius > hitBoxY &&
          proj.y - proj.radius < hitBoxY + hitBoxH
        ) {
          proj.fromPlayer = true;
          proj.vx = p.facing * 520;
          proj.vy = -40;
          proj.color = '#fbbf24';
          proj.life = 2.0;
          this.sound.playDeflect();
          this.hitstopTimer = 0.04;
          this.spawnBurst(proj.x, proj.y, '#fef08a', 10, 180, true);
          this.addFloatingText(proj.x, proj.y - 12, 'REBATIDO', '#fef08a');
          landedHit = true;
        }
      }

      if (landedHit) {
        p.vx -= p.facing * 65;
      }
      void sx;
    }

    // Horizontal Movement
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      if (Math.random() < 0.7) {
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          alpha: 0.75,
          color: '#64748b',
        });
      }
    } else {
      const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (moveDir !== 0) {
        p.facing = moveDir as 1 | -1;
        const targetVx = moveDir * MOVE_SPEED;
        p.vx += (targetVx - p.vx) * Math.min(1, dt * (p.grounded ? 16 : 10));
        if (p.grounded) {
          p.runCycle += dt * 13;
          const stepIdx = Math.floor(p.runCycle / Math.PI);
          if (stepIdx !== this.lastStepIndex) {
            this.lastStepIndex = stepIdx;
            this.sound.playFootstep(this.currentBiome);
            this.spawnBurst(p.x + p.w * 0.5, p.y + p.h, 'rgba(148, 163, 184, 0.5)', 2, 48, false);
          }
        }
      } else {
        p.vx *= Math.pow(0.001, dt);
        if (Math.abs(p.vx) < 8) p.vx = 0;
      }

      // Jump (with Coyote Time + Double Jump + Jump Buffer)
      if (p.jumpBufferTimer > 0) {
        if (p.coyoteTimer > 0 || p.grounded) {
          p.vy = JUMP_VEL;
          p.grounded = false;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          p.jumpsLeft = 1;
          p.scaleX = 0.8;
          p.scaleY = 1.24;
          this.sound.playJump(false);
          this.spawnBurst(p.x + p.w * 0.5, p.y + p.h, '#64748b', 6, 95, false);
        } else if (p.jumpsLeft > 0) {
          p.vy = DOUBLE_JUMP_VEL;
          p.jumpsLeft -= 1;
          p.jumpBufferTimer = 0;
          p.scaleX = 0.82;
          p.scaleY = 1.22;
          this.sound.playJump(true);
          this.spawnBurst(p.x + p.w * 0.5, p.y + p.h, '#94a3b8', 8, 130, true);
        }
      }

      // Variable jump height cut when button released early
      if (!input.jumpHeld && p.vy < -220) {
        p.vy *= Math.pow(0.04, dt);
      }

      // Gravity
      p.vy = Math.min(1050, p.vy + GRAVITY * dt);
    }

    // Integrate X & Collide
    p.x += p.vx * dt;
    p.x = Math.max(0, Math.min(this.level.worldWidth - p.w, p.x));
    for (const plat of this.level.platforms) {
      if (plat.oneWay) continue;
      if (
        p.x < plat.x + plat.w &&
        p.x + p.w > plat.x &&
        p.y + 4 < plat.y + plat.h &&
        p.y + p.h - 4 > plat.y
      ) {
        if (p.vx > 0) p.x = plat.x - p.w;
        else if (p.vx < 0) p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }

    // Integrate Y & Collide
    const prevY = p.y;
    const wasGrounded = p.grounded;
    p.y += p.vy * dt;
    p.grounded = false;

    for (const plat of this.level.platforms) {
      const overlapX = p.x < plat.x + plat.w && p.x + p.w > plat.x;
      if (!overlapX) continue;

      if (plat.oneWay) {
        if (p.vy >= 0 && prevY + p.h <= plat.y + 10 && p.y + p.h >= plat.y) {
          p.y = plat.y - p.h;
          this.onPlayerLand(wasGrounded);
        }
      } else {
        if (p.y < plat.y + plat.h && p.y + p.h > plat.y) {
          if (p.vy >= 0 && prevY + p.h <= plat.y + 16) {
            p.y = plat.y - p.h;
            this.onPlayerLand(wasGrounded);
          } else if (p.vy < 0 && prevY >= plat.y + plat.h - 16) {
            p.y = plat.y + plat.h;
            p.vy = 0;
          }
        }
      }
    }

    if (p.grounded) {
      p.coyoteTimer = 0.115;
      p.jumpsLeft = 2;
    }

    // Fall into abyss / flooded pit
    if (p.y > this.level.fallLimitY) {
      this.damagePlayer(1, p.facing * -1);
      if (this.phase === 'PLAYING') {
        p.x = p.spawnX;
        p.y = p.spawnY;
        p.vx = 0;
        p.vy = 0;
        this.resetCoatPosition();
      }
    }
  }

  private onPlayerLand(wasGrounded: boolean): void {
    const p = this.player;
    const impact = p.vy;
    p.vy = 0;
    p.grounded = true;
    if (!wasGrounded && impact > 240) {
      const intensity = Math.min(1, impact / 850);
      p.scaleX = 1 + intensity * 0.25;
      p.scaleY = 1 - intensity * 0.22;
      this.sound.playLand(intensity);
      this.spawnBurst(p.x + p.w * 0.5, p.y + p.h, '#64748b', 6, 85, false);
    }
  }

  private resetCoatPosition(): void {
    const p = this.player;
    for (let i = 0; i < p.coat.length; i++) {
      p.coat[i].x = p.x + p.w * 0.5 - p.facing * i * 6;
      p.coat[i].y = p.y + 18 + i * 2;
      p.coat[i].prevX = p.coat[i].x;
      p.coat[i].prevY = p.coat[i].y;
    }
  }

  private updateCoatPhysics(dt: number): void {
    const p = this.player;
    const anchorX = p.x + p.w * 0.5 - p.facing * 5;
    const anchorY = p.y + 16;

    p.coat[0].x = anchorX;
    p.coat[0].y = anchorY;

    const windX = -p.facing * 35 + Math.sin(this.elapsedTime * 3.8) * 18;
    for (let i = 1; i < p.coat.length; i++) {
      const node = p.coat[i];
      const vx = (node.x - node.prevX) * 0.84;
      const vy = (node.y - node.prevY) * 0.84;
      node.prevX = node.x;
      node.prevY = node.y;
      node.x += vx + windX * dt;
      node.y += vy + 180 * dt;
    }

    const segLen = 6.2;
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 1; i < p.coat.length; i++) {
        const prev = p.coat[i - 1];
        const curr = p.coat[i];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const diff = (dist - segLen) / dist;
        curr.x -= dx * diff;
        curr.y -= dy * diff;
      }
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    const px = p.x + p.w * 0.5;
    const py = p.y + p.h * 0.5;

    for (const e of this.level.enemies) {
      if (e.dead) {
        e.deathTimer = Math.max(0, e.deathTimer - dt);
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.animTime += dt;

      const ex = e.x + e.w * 0.5;
      const ey = e.y + e.h * 0.5;
      const distToPlayer = Math.hypot(px - ex, py - ey);

      if (e.kind === 'crawler') {
        if (e.state === 'patrol') {
          e.x += e.vx * dt;
          if (e.x <= e.patrolMinX) {
            e.x = e.patrolMinX;
            e.vx = Math.abs(e.vx);
          } else if (e.x >= e.patrolMaxX) {
            e.x = e.patrolMaxX;
            e.vx = -Math.abs(e.vx);
          }
          e.facing = e.vx >= 0 ? 1 : -1;

          if (distToPlayer < 220 && Math.abs(py - ey) < 95) {
            e.state = 'windup';
            e.stateTimer = 0.42;
            e.facing = px >= ex ? 1 : -1;
            this.sound.playMonsterShriek();
          }
        } else if (e.state === 'windup') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'attack';
            e.stateTimer = 0.36;
            e.vx = e.facing * 295;
          }
        } else if (e.state === 'attack') {
          e.x += e.vx * dt;
          e.x = Math.max(e.patrolMinX - 20, Math.min(e.patrolMaxX + 20, e.x));
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'cooldown';
            e.stateTimer = 0.65;
          }
        } else if (e.state === 'cooldown') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'patrol';
            e.vx = e.facing * 78;
          }
        }
      } else if (e.kind === 'wraith') {
        if (e.state === 'patrol') {
          e.x += e.vx * dt;
          if (e.x <= e.patrolMinX || e.x >= e.patrolMaxX) e.vx *= -1;
          e.facing = px >= ex ? 1 : -1;
          e.stateTimer -= dt;
          if (distToPlayer < 450 && e.stateTimer <= 0) {
            e.state = 'windup';
            e.stateTimer = 0.78;
          }
        } else if (e.state === 'windup') {
          e.facing = px >= ex ? 1 : -1;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            const angle = Math.atan2(py - ey, px - ex);
            const speed = 290;
            this.projectiles.push({
              id: `proj_${Math.random()}`,
              x: ex,
              y: ey - 8,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: 7,
              fromPlayer: false,
              life: 3.0,
              color: '#dc2626',
            });
            e.state = 'cooldown';
            e.stateTimer = 1.65;
          }
        } else if (e.state === 'cooldown') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'patrol';
            e.stateTimer = 0.9;
          }
        }
      } else if (e.kind === 'warden') {
        this.updateWardenBoss(e, dt, px, ex);
      }

      // Contact damage check
      if (
        p.invulnTimer <= 0 &&
        p.x + 4 < e.x + e.w &&
        p.x + p.w - 4 > e.x &&
        p.y + 4 < e.y + e.h &&
        p.y + p.h - 4 > e.y
      ) {
        this.damagePlayer(1, px < ex ? -1 : 1);
      }
    }
  }

  private updateWardenBoss(boss: Enemy, dt: number, px: number, bx: number): void {
    if (boss.state === 'dormant') {
      if (px > 1380) {
        boss.state = 'cooldown';
        boss.stateTimer = 1.1;
        this.bossAwakened = true;
        this.showSubtitle('O Carcereiro de Blackwood', 'As correntes se partem na escuridão. Sobreviva ao Carcereiro.');
        this.sound.playMonsterShriek();
        this.pushHudSnapshot(true);
      }
      return;
    }

    if (boss.hp <= boss.maxHp * 0.5 && boss.phase === 1) {
      boss.phase = 2;
      this.shakeTrauma = 0.7;
      this.sound.playWardenSlam();
      this.spawnBurst(bx, boss.y + boss.h * 0.5, '#dc2626', 24, 250, true);
      this.addFloatingText(bx, boss.y - 14, 'FÚRIA DA CRIPTA', '#ef4444');
    }

    const speedMult = boss.phase === 2 ? 1.28 : 1.0;

    if (boss.state === 'cooldown') {
      boss.facing = px >= bx ? 1 : -1;
      boss.x += boss.facing * 52 * speedMult * dt;
      boss.x = Math.max(boss.patrolMinX, Math.min(boss.patrolMaxX, boss.x));
      boss.stateTimer -= dt;
      if (boss.stateTimer <= 0) {
        boss.attackPattern = (boss.attackPattern + 1) % 3;
        boss.state = 'windup';
        boss.stateTimer = boss.phase === 2 ? 0.52 : 0.68;
        this.sound.playMonsterShriek();
      }
    } else if (boss.state === 'windup') {
      boss.facing = px >= bx ? 1 : -1;
      boss.stateTimer -= dt;
      if (boss.stateTimer <= 0) {
        boss.state = 'attack';
        if (boss.attackPattern === 0) {
          boss.stateTimer = 0.48;
          boss.vx = boss.facing * 430 * speedMult;
        } else if (boss.attackPattern === 1) {
          boss.stateTimer = 0.35;
          this.sound.playWardenSlam();
          this.shakeTrauma = 0.65;
          this.shockwaves.push({
            x: bx,
            y: boss.y + boss.h - 4,
            radius: 20,
            maxRadius: 230,
            alpha: 0.95,
            color: '#ef4444',
            lineWidth: 6,
          });
          if (Math.abs(px - bx) < 220 && this.player.grounded && this.player.invulnTimer <= 0) {
            this.damagePlayer(1, px < bx ? -1 : 1);
          }
        } else {
          boss.stateTimer = 0.4;
          const count = boss.phase === 2 ? 5 : 3;
          for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 0.28;
            const baseAngle = boss.facing === 1 ? 0 : Math.PI;
            const ang = baseAngle + spread;
            this.projectiles.push({
              id: `bproj_${Math.random()}`,
              x: bx,
              y: boss.y + 44,
              vx: Math.cos(ang) * 280,
              vy: Math.sin(ang) * 280,
              radius: 9,
              fromPlayer: false,
              life: 3.2,
              color: '#dc2626',
            });
          }
        }
      }
    } else if (boss.state === 'attack') {
      if (boss.attackPattern === 0) {
        boss.x += boss.vx * dt;
        boss.x = Math.max(boss.patrolMinX, Math.min(boss.patrolMaxX, boss.x));
      }
      boss.stateTimer -= dt;
      if (boss.stateTimer <= 0) {
        boss.vx = 0;
        boss.state = 'cooldown';
        boss.stateTimer = boss.phase === 2 ? 0.92 : 1.28;
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const p = this.player;
    const next: Projectile[] = [];

    for (const proj of this.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0) continue;

      let hit = false;
      if (proj.fromPlayer) {
        for (const e of this.level.enemies) {
          if (e.dead || e.state === 'dormant') continue;
          if (
            proj.x + proj.radius > e.x &&
            proj.x - proj.radius < e.x + e.w &&
            proj.y + proj.radius > e.y &&
            proj.y - proj.radius < e.y + e.h
          ) {
            this.damageEnemy(e, 2, proj.vx >= 0 ? 1 : -1, true);
            hit = true;
            break;
          }
        }
      } else if (
        p.invulnTimer <= 0 &&
        proj.x + proj.radius > p.x &&
        proj.x - proj.radius < p.x + p.w &&
        proj.y + proj.radius > p.y &&
        proj.y - proj.radius < p.y + p.h
      ) {
        this.damagePlayer(1, proj.vx >= 0 ? 1 : -1);
        hit = true;
      }

      if (!hit) next.push(proj);
    }

    this.projectiles = next;
  }

  private updateWorldInteractions(dt: number): void {
    const p = this.player;
    const px = p.x + p.w * 0.5;
    const py = p.y + p.h * 0.5;

    // Hazards
    if (p.invulnTimer <= 0) {
      for (const h of this.level.hazards) {
        if (p.x + 4 < h.x + h.w && p.x + p.w - 4 > h.x && p.y + p.h > h.y && p.y < h.y + h.h) {
          this.damagePlayer(1, -p.facing);
          p.vy = -420;
          break;
        }
      }
    }

    // Collectibles
    for (const c of this.level.collectibles) {
      if (c.collected) continue;
      if (Math.hypot(px - c.x, py - c.y) < 34) {
        c.collected = true;
        if (c.kind === 'diary_page') {
          this.pagesCollected += 1;
          p.oil = Math.min(p.maxOil, p.oil + 25);
          this.sound.playPagePickup(this.pagesCollected);
          this.spawnBurst(c.x, c.y, '#fef3c7', 12, 160, true);
          this.addFloatingText(c.x, c.y - 12, 'PÁGINA +1', '#fef3c7');
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          p.oil = p.maxOil;
          this.sound.playOilPickup();
          this.spawnBurst(c.x, c.y, '#fbbf24', 16, 180, true);
          this.addFloatingText(c.x, c.y - 12, 'ÓLEO & VITALIDADE', '#fbbf24');
        }
        this.pushHudSnapshot(true);
      }
    }

    // Checkpoints (Sanctuary Candles)
    for (const cp of this.level.checkpoints) {
      if (!cp.activated && Math.abs(px - cp.x) < 42 && Math.abs(p.y + p.h - cp.y) < 60) {
        cp.activated = true;
        p.spawnX = cp.x - p.w * 0.5;
        p.spawnY = cp.y - p.h - 4;
        p.hp = p.maxHp;
        p.oil = p.maxOil;
        this.sound.playCheckpoint();
        this.spawnBurst(cp.x, cp.y - 54, '#fbbf24', 20, 190, true);
        this.checkpointNotice = `Vela Acesa · ${cp.label}`;
        this.checkpointNoticeTimer = 3.0;
        this.pushHudSnapshot(true);
      }
    }

    // Diary Monoliths
    for (const m of this.level.monoliths) {
      if (!m.triggered && Math.abs(px - m.x) < 55 && Math.abs(p.y + p.h - m.y) < 65) {
        m.triggered = true;
        this.sound.playPagePickup(0);
        this.showSubtitle(m.title, m.line);
      }
    }

    // Dawn Exit Gate
    const boss = this.level.enemies.find((e) => e.kind === 'warden');
    if (boss && boss.dead && !this.level.exitGate.unlocked) {
      this.level.exitGate.unlocked = true;
    }

    if (
      this.level.exitGate.unlocked &&
      Math.abs(px - this.level.exitGate.x) < 65 &&
      Math.abs(p.y + p.h - this.level.exitGate.y) < 80
    ) {
      this.level.exitGate.openProgress = Math.min(1, this.level.exitGate.openProgress + dt * 1.4);
      if (this.level.exitGate.openProgress >= 1) {
        this.sound.playVictory();
        this.sound.setAmbientActive(false);
        this.onStageCleared?.(this.currentStageIndex);
        if (this.currentStageIndex < STAGES.length - 1) {
          this.setPhase('STAGE_CLEAR');
        } else {
          this.setPhase('VICTORY');
        }
        this.pushHudSnapshot(true);
      }
    }
  }

  private damageEnemy(e: Enemy, dmg: number, dir: number, heavy: boolean): void {
    e.hp -= dmg;
    e.hitFlash = 0.14;
    if (e.kind !== 'warden') {
      e.x = Math.max(e.patrolMinX, Math.min(e.patrolMaxX, e.x + dir * (heavy ? 24 : 12)));
    }
    this.hitstopTimer = heavy ? 0.065 : 0.04;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + (heavy ? 0.42 : 0.22));
    this.sound.playHit(heavy);

    const cx = e.x + e.w * 0.5;
    const cy = e.y + e.h * 0.45;
    this.spawnBurst(cx, cy, heavy ? '#991b1b' : '#7f1d1d', heavy ? 20 : 12, 210, false);
    if (heavy) {
      this.spawnBurst(cx, cy, '#fef08a', 6, 170, true);
    }

    this.player.oil = Math.min(this.player.maxOil, this.player.oil + 10);

    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      e.deathTimer = 0.35;
      this.enemiesBanished += 1;
      this.spawnBurst(cx, cy, '#94a3b8', 22, 240, true);
      if (e.kind === 'warden') {
        this.sound.playWardenSlam();
        this.shakeTrauma = 0.9;
        this.showSubtitle('O Amanhecer Desponta', 'O Carcereiro caiu. Atravesse o Portão da Alvorada para escapar de Blackwood.');
      }
    }
    this.pushHudSnapshot(true);
  }

  private damagePlayer(dmg: number, knockDir: number): void {
    const p = this.player;
    if (p.invulnTimer > 0) return;

    p.hp = Math.max(0, p.hp - dmg);
    p.invulnTimer = 1.15;
    p.hitFlash = 0.18;
    p.vx = knockDir * 240;
    p.vy = -260;
    this.hitstopTimer = 0.06;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.58);
    this.sound.playPlayerHurt();
    this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, '#dc2626', 14, 190, true);

    if (p.hp <= 0) {
      this.deaths += 1;
      this.sound.playGameOver();
      this.sound.setAmbientActive(false);
      this.setPhase('GAME_OVER');
    }
    this.pushHudSnapshot(true);
  }

  private updateVfx(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += pt.gravity * dt;
      pt.life -= dt;
      if (pt.life <= 0) pt.active = false;
    }

    this.afterimages = this.afterimages.filter((img) => {
      img.alpha -= dt * 4.5;
      return img.alpha > 0;
    });

    this.slashes = this.slashes.filter((s) => {
      s.timer -= dt;
      return s.timer > 0;
    });

    this.shockwaves = this.shockwaves.filter((sw) => {
      sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 9);
      sw.alpha -= dt * 2.2;
      return sw.alpha > 0;
    });

    this.floatingTexts = this.floatingTexts.filter((ft) => {
      ft.y += ft.vy * dt;
      ft.life -= dt;
      return ft.life > 0;
    });
  }

  private updateCamera(dt: number): void {
    const scale = Math.max(1.0, Math.min(1.55, this.logicalH / 500));
    const viewW = this.logicalW / scale;
    const viewH = this.logicalH / scale;

    const lookAhead = this.player.facing * 82;
    const targetX = Math.max(0, Math.min(this.level.worldWidth - viewW, this.player.x + lookAhead - viewW * 0.42));
    const targetY = Math.max(-20, Math.min(220, this.player.y - viewH * 0.6));

    this.cameraX += (targetX - this.cameraX) * Math.min(1, dt * 6.5);
    this.cameraY += (targetY - this.cameraY) * Math.min(1, dt * 5.0);
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.1);
  }

  private getDangerLevel(): number {
    if (this.phase !== 'PLAYING') return 0;
    if (this.player.hp <= 1) return 0.95;
    if (this.player.hp <= 2) return 0.55;
    const px = this.player.x + this.player.w * 0.5;
    for (const e of this.level.enemies) {
      if (!e.dead && e.state !== 'dormant' && Math.abs(e.x - px) < 260) {
        return 0.45;
      }
    }
    return 0;
  }

  private spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number,
    glow: boolean
  ): void {
    let spawned = 0;
    for (const pt of this.particles) {
      if (pt.active) continue;
      const angle = Math.random() * Math.PI * 2;
      const mag = (0.3 + Math.random() * 0.7) * speed;
      pt.active = true;
      pt.x = x;
      pt.y = y;
      pt.vx = Math.cos(angle) * mag;
      pt.vy = Math.sin(angle) * mag - 30;
      pt.size = 2 + Math.random() * 3.5;
      pt.maxLife = 0.25 + Math.random() * 0.35;
      pt.life = pt.maxLife;
      pt.color = color;
      pt.gravity = 320;
      pt.glow = glow;
      spawned += 1;
      if (spawned >= count) break;
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      vy: -42,
      text,
      color,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  private showSubtitle(title: string, line: string): void {
    this.subtitleTitle = title;
    this.subtitleText = line;
    this.subtitleTimer = 5.4;
    this.pushHudSnapshot(true);
  }

  private pushHudSnapshot(force: boolean): void {
    if (!force && this.elapsedTime - this.lastHudPush < 0.08) return;
    this.lastHudPush = this.elapsedTime;

    const warden = this.level.enemies.find((e) => e.kind === 'warden');
    const bossActive = Boolean(warden && !warden.dead && warden.state !== 'dormant');
    const info = STAGES[this.currentStageIndex] ?? STAGES[0];

    const nearExit = Math.abs(this.player.x + this.player.w * 0.5 - this.level.exitGate.x) < 420;
    const exitPrompt = this.level.exitGate.unlocked && (nearExit || this.bossAwakened);

    this.onHudUpdate({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      oil: Math.round(this.player.oil),
      maxOil: this.player.maxOil,
      pages: this.pagesCollected,
      totalPages: this.totalPages,
      enemiesBanished: this.enemiesBanished,
      deaths: this.deaths,
      elapsedSeconds: Math.floor(this.playSeconds),
      stageIndex: this.currentStageIndex,
      totalStages: STAGES.length,
      biome: this.currentBiome,
      chapterTitle: info.title,
      chapterSubtitle: info.subtitle,
      bossActive,
      bossName: 'O Carcereiro de Blackwood',
      bossHp: warden ? Math.max(0, warden.hp) : 0,
      bossMaxHp: warden ? warden.maxHp : 24,
      subtitleText: this.subtitleText,
      subtitleTitle: this.subtitleTitle,
      chapterBannerTimer: this.chapterBannerTimer,
      checkpointNotice: this.checkpointNotice,
      exitPrompt,
      canHealPrompt: this.player.hp < this.player.maxHp && this.healCooldown <= 0,
      heartbeatDanger: this.getDangerLevel() > 0.5,
    });
  }

  private renderFrame(): void {
    const shakeMag = this.shakeTrauma * this.shakeTrauma * 14;
    const shakeX = (Math.random() * 2 - 1) * shakeMag;
    const shakeY = (Math.random() * 2 - 1) * shakeMag;

    this.renderer.render(this.ctx, this.logicalW, this.logicalH, {
      level: this.level,
      player: this.player,
      projectiles: this.projectiles,
      particles: this.particles,
      afterimages: this.afterimages,
      slashes: this.slashes,
      shockwaves: this.shockwaves,
      floatingTexts: this.floatingTexts,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      shakeX,
      shakeY,
      time: this.elapsedTime,
      letterbox: this.letterbox,
      lightningFlash: this.lightningFlash,
      dangerLevel: this.getDangerLevel(),
    });
  }
}
