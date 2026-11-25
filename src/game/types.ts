export type GamePhase = 'TITLE' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'VICTORY' | 'GAME_OVER';

export type BiomeId = 'forest' | 'cemetery' | 'chapel' | 'asylum' | 'mansion' | 'lab' | 'crypt';

export interface StageMeta {
  index: number;
  title: string;
  subtitle: string;
  biome: BiomeId;
  summary: string;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  biome: BiomeId;
  kind: 'ground' | 'ledge' | 'bridge' | 'pillar';
  oneWay?: boolean;
}

export interface Hazard {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'barbed_wire' | 'broken_glass' | 'blood_spikes';
}

export interface WaterZone {
  x: number;
  y: number;
  w: number;
  h: number;
  biome: BiomeId;
}

export interface SceneryProp {
  x: number;
  y: number;
  kind:
    | 'streetlamp'
    | 'iron_gate'
    | 'dead_tree'
    | 'gurney'
    | 'flicker_tube'
    | 'hanging_chain'
    | 'blood_candle'
    | 'tombstone'
    | 'altar_cross';
  scale?: number;
  biome: BiomeId;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  bobOffset: number;
  kind: 'diary_page' | 'oil_flask';
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  biome: BiomeId;
  label: string;
  activated: boolean;
}

export interface Monolith {
  id: string;
  x: number;
  y: number;
  title: string;
  line: string;
  triggered: boolean;
}

export type EnemyKind = 'crawler' | 'wraith' | 'warden';

export type EnemyState =
  | 'patrol'
  | 'windup'
  | 'attack'
  | 'recover'
  | 'cooldown'
  | 'dormant';

export interface Enemy {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  patrolMinX: number;
  patrolMaxX: number;
  baseY: number;
  state: EnemyState;
  stateTimer: number;
  hitFlash: number;
  dead: boolean;
  deathTimer: number;
  phase: 1 | 2;
  attackPattern: number;
  animTime: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fromPlayer: boolean;
  life: number;
  color: string;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  glow: boolean;
}

export interface Afterimage {
  x: number;
  y: number;
  facing: 1 | -1;
  alpha: number;
  color: string;
}

export interface SlashEffect {
  x: number;
  y: number;
  facing: 1 | -1;
  comboStep: number;
  timer: number;
  duration: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface CoatNode {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpsLeft: number;
  dashTimer: number;
  dashCooldown: number;
  attackTimer: number;
  attackCooldown: number;
  comboStep: number;
  comboResetTimer: number;
  flareCooldown: number;
  invulnTimer: number;
  hitFlash: number;
  hp: number;
  maxHp: number;
  oil: number;
  maxOil: number;
  scaleX: number;
  scaleY: number;
  runCycle: number;
  animTime: number;
  spawnX: number;
  spawnY: number;
  coat: CoatNode[];
}

export interface ExitGate {
  x: number;
  y: number;
  unlocked: boolean;
  openProgress: number;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  oil: number;
  maxOil: number;
  pages: number;
  totalPages: number;
  enemiesBanished: number;
  deaths: number;
  elapsedSeconds: number;
  stageIndex: number;
  totalStages: number;
  biome: BiomeId;
  chapterTitle: string;
  chapterSubtitle: string;
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  subtitleText: string | null;
  subtitleTitle: string | null;
  chapterBannerTimer: number;
  checkpointNotice: string | null;
  exitPrompt: boolean;
  canHealPrompt: boolean;
  heartbeatDanger: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  attackJustPressed: boolean;
  dashJustPressed: boolean;
  flareJustPressed: boolean;
  healJustPressed: boolean;
}
