import {
  BiomeId,
  Checkpoint,
  Collectible,
  Enemy,
  ExitGate,
  Hazard,
  Monolith,
  Platform,
  SceneryProp,
  StageMeta,
  WaterZone,
} from './types';

export interface LevelData {
  biome: BiomeId;
  platforms: Platform[];
  hazards: Hazard[];
  waterZones: WaterZone[];
  props: SceneryProp[];
  collectibles: Collectible[];
  checkpoints: Checkpoint[];
  monoliths: Monolith[];
  enemies: Enemy[];
  exitGate: ExitGate;
  worldWidth: number;
  fallLimitY: number;
}

export const STAGES: StageMeta[] = [
  {
    index: 0,
    title: 'Fase 1 · Floresta da Névoa',
    subtitle: 'Os portões externos de Blackwood rangem sob a tempestade',
    biome: 'forest',
    summary: 'Trilha na mata fechada com pontes antigas e os primeiros Rastejantes.',
  },
  {
    index: 1,
    title: 'Fase 2 · Cemitério dos Esquecidos',
    subtitle: 'Mausoléus cobertos de musgo e vigílias entre lápides partidas',
    biome: 'cemetery',
    summary: 'Valas alagadas, mausoléus em ruínas e a primeira Aparição noturna.',
  },
  {
    index: 2,
    title: 'Fase 3 · Capela em Ruínas',
    subtitle: 'Vitrais estilhaçados pela tempestade acima dos antigos altares',
    biome: 'chapel',
    summary: 'Colunas góticas partidas, passagens elevadas e vigílias espectrais.',
  },
  {
    index: 3,
    title: 'Fase 4 · Ala Oeste do Sanatório',
    subtitle: 'Corredores abandonados onde as lâmpadas ainda piscam sozinhas',
    biome: 'asylum',
    summary: 'Pisos rachados, cacos de vidro e sentinelas espectrais pelos salões.',
  },
  {
    index: 4,
    title: 'Fase 5 · Pavilhão da Quarentena',
    subtitle: 'Enfermarias trancadas e passarelas estreitas sobre o fosso',
    biome: 'asylum',
    summary: 'Alas de isolamento com armadilhas de vidro e fogo cruzado duplo.',
  },
  {
    index: 5,
    title: 'Fase 6 · Mansão do Diretor',
    subtitle: 'O antigo casarão vitoriano guarda os registros ocultos de Blackwood',
    biome: 'mansion',
    summary: 'Assoalhos quebrados, vigas altas e emboscadas na biblioteca escura.',
  },
  {
    index: 6,
    title: 'Fase 7 · Porão e Laboratório',
    subtitle: 'Caldeiras enferrujadas e passarelas sobre o subsolo inundado',
    biome: 'lab',
    summary: 'Plataformas suspensas sobre água escura e fogo cruzado nos dutos.',
  },
  {
    index: 7,
    title: 'Fase 8 · Dutos do Esgoto Escuro',
    subtitle: 'Galerias de drenagem tomadas pela enchente abaixo do laboratório',
    biome: 'lab',
    summary: 'Pilares estreitos sobre águas profundas e sentinelas em sequência.',
  },
  {
    index: 8,
    title: 'Fase 9 · Catacumbas do Pêndulo',
    subtitle: 'Galerias de calcário úmido e correntes no coração da terra',
    biome: 'crypt',
    summary: 'Saltos estreitos sobre espinhos de ferro e guardas da cripta.',
  },
  {
    index: 9,
    title: 'Fase 10 · Santuário do Carcereiro',
    subtitle: 'A câmara final que separa você do Portão da Alvorada',
    biome: 'crypt',
    summary: 'Confronto decisivo contra O Carcereiro de Blackwood para escapar vivo.',
  },
];

function makeEnemy(
  id: string,
  kind: 'crawler' | 'wraith' | 'warden',
  x: number,
  y: number,
  patrolMinX: number,
  patrolMaxX: number
): Enemy {
  if (kind === 'crawler') {
    return {
      id,
      kind,
      x,
      y,
      w: 38,
      h: 46,
      vx: 80,
      vy: 0,
      facing: 1,
      hp: 3,
      maxHp: 3,
      patrolMinX,
      patrolMaxX,
      baseY: y,
      state: 'patrol',
      stateTimer: 0,
      hitFlash: 0,
      dead: false,
      deathTimer: 0,
      phase: 1,
      attackPattern: 0,
      animTime: Math.random() * 10,
    };
  }
  if (kind === 'wraith') {
    return {
      id,
      kind,
      x,
      y,
      w: 38,
      h: 52,
      vx: 46,
      vy: 0,
      facing: -1,
      hp: 4,
      maxHp: 4,
      patrolMinX,
      patrolMaxX,
      baseY: y,
      state: 'patrol',
      stateTimer: 1.5,
      hitFlash: 0,
      dead: false,
      deathTimer: 0,
      phase: 1,
      attackPattern: 0,
      animTime: Math.random() * 10,
    };
  }
  return {
    id,
    kind: 'warden',
    x,
    y,
    w: 74,
    h: 108,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: 24,
    maxHp: 24,
    patrolMinX,
    patrolMaxX,
    baseY: y,
    state: 'dormant',
    stateTimer: 0,
    hitFlash: 0,
    dead: false,
    deathTimer: 0,
    phase: 1,
    attackPattern: 0,
    animTime: 0,
  };
}

export function createStageLevel(stageIndex: number): LevelData {
  const clamped = Math.max(0, Math.min(STAGES.length - 1, stageIndex));

  // ==================== FASE 1: FLORESTA DA NÉVOA ====================
  if (clamped === 0) {
    return {
      biome: 'forest',
      worldWidth: 3850,
      fallLimitY: 780,
      platforms: [
        { id: 's1_p1', x: -120, y: 540, w: 860, h: 240, biome: 'forest', kind: 'ground' },
        { id: 's1_p2', x: 840, y: 490, w: 280, h: 290, biome: 'forest', kind: 'ground' },
        { id: 's1_l1', x: 930, y: 375, w: 150, h: 22, biome: 'forest', kind: 'ledge', oneWay: true },
        { id: 's1_p3', x: 1210, y: 445, w: 360, h: 335, biome: 'forest', kind: 'ground' },
        { id: 's1_b1', x: 1620, y: 460, w: 180, h: 22, biome: 'forest', kind: 'bridge', oneWay: true },
        { id: 's1_p4', x: 1860, y: 500, w: 660, h: 280, biome: 'forest', kind: 'ground' },
        { id: 's1_l2', x: 2070, y: 350, w: 200, h: 22, biome: 'forest', kind: 'ledge', oneWay: true },
        { id: 's1_b2', x: 2610, y: 450, w: 180, h: 22, biome: 'forest', kind: 'bridge', oneWay: true },
        { id: 's1_p5', x: 2870, y: 505, w: 980, h: 275, biome: 'forest', kind: 'ground' },
        { id: 's1_l3', x: 3110, y: 385, w: 180, h: 22, biome: 'forest', kind: 'ledge', oneWay: true },
      ],
      hazards: [
        { id: 's1_h1', x: 1340, y: 431, w: 74, h: 16, kind: 'barbed_wire' },
        { id: 's1_h2', x: 3040, y: 491, w: 92, h: 16, kind: 'barbed_wire' },
      ],
      waterZones: [{ x: 1550, y: 565, w: 330, h: 140, biome: 'forest' }],
      props: [
        { x: 140, y: 540, kind: 'streetlamp', biome: 'forest' },
        { x: 430, y: 540, kind: 'iron_gate', biome: 'forest', scale: 1.1 },
        { x: 640, y: 540, kind: 'dead_tree', biome: 'forest' },
        { x: 980, y: 490, kind: 'dead_tree', biome: 'forest' },
        { x: 1930, y: 500, kind: 'streetlamp', biome: 'forest' },
        { x: 2350, y: 500, kind: 'dead_tree', biome: 'forest' },
        { x: 2940, y: 505, kind: 'streetlamp', biome: 'forest' },
        { x: 3390, y: 505, kind: 'iron_gate', biome: 'forest', scale: 1.15 },
      ],
      collectibles: [
        { id: 's1_c1', x: 520, y: 492, collected: false, bobOffset: 0.2, kind: 'diary_page' },
        { id: 's1_c2', x: 1005, y: 325, collected: false, bobOffset: 1.1, kind: 'diary_page' },
        { id: 's1_c3', x: 1705, y: 405, collected: false, bobOffset: 1.9, kind: 'diary_page' },
        { id: 's1_c4', x: 2170, y: 295, collected: false, bobOffset: 0.7, kind: 'oil_flask' },
        { id: 's1_c5', x: 3200, y: 335, collected: false, bobOffset: 2.3, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's1_cp1', x: 1910, y: 500, biome: 'forest', label: 'Lanterna da Encruzilhada', activated: false },
      ],
      monoliths: [
        {
          id: 's1_m1',
          x: 340,
          y: 540,
          title: 'Bilhete no Portão',
          line: '“Ninguém sai de Blackwood depois que a sirene toca. Mantenha a lanterna acesa e evite a névoa.”',
          triggered: false,
        },
        {
          id: 's1_m2',
          x: 2910,
          y: 505,
          title: 'Aviso na Cerca',
          line: '“O antigo cemitério guarda o único atalho até a ala oeste do sanatório.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s1_e1', 'crawler', 1420, 399, 1230, 1530),
        makeEnemy('s1_e2', 'crawler', 2240, 454, 2000, 2460),
        makeEnemy('s1_e3', 'crawler', 3250, 459, 3150, 3490),
      ],
      exitGate: { x: 3630, y: 505, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 2: CEMITÉRIO DOS ESQUECIDOS ====================
  if (clamped === 1) {
    return {
      biome: 'cemetery',
      worldWidth: 4050,
      fallLimitY: 780,
      platforms: [
        { id: 's2_p1', x: -120, y: 540, w: 680, h: 240, biome: 'cemetery', kind: 'ground' },
        { id: 's2_p2', x: 660, y: 485, w: 220, h: 295, biome: 'cemetery', kind: 'pillar' },
        { id: 's2_l1', x: 960, y: 430, w: 180, h: 22, biome: 'cemetery', kind: 'bridge', oneWay: true },
        { id: 's2_p3', x: 1220, y: 495, w: 540, h: 285, biome: 'cemetery', kind: 'ground' },
        { id: 's2_l2', x: 1380, y: 360, w: 200, h: 22, biome: 'cemetery', kind: 'ledge', oneWay: true },
        { id: 's2_p4', x: 1880, y: 510, w: 560, h: 270, biome: 'cemetery', kind: 'ground' },
        { id: 's2_l3', x: 2040, y: 375, w: 190, h: 22, biome: 'cemetery', kind: 'ledge', oneWay: true },
        { id: 's2_p5', x: 2540, y: 455, w: 190, h: 325, biome: 'cemetery', kind: 'pillar' },
        { id: 's2_b1', x: 2820, y: 410, w: 170, h: 22, biome: 'cemetery', kind: 'bridge', oneWay: true },
        { id: 's2_p6', x: 3080, y: 495, w: 970, h: 285, biome: 'cemetery', kind: 'ground' },
        { id: 's2_l4', x: 3320, y: 355, w: 210, h: 22, biome: 'cemetery', kind: 'ledge', oneWay: true },
      ],
      hazards: [
        { id: 's2_h1', x: 1410, y: 481, w: 84, h: 16, kind: 'barbed_wire' },
        { id: 's2_h2', x: 3240, y: 481, w: 96, h: 16, kind: 'barbed_wire' },
      ],
      waterZones: [
        { x: 540, y: 580, w: 700, h: 160, biome: 'cemetery' },
        { x: 2420, y: 580, w: 680, h: 160, biome: 'cemetery' },
      ],
      props: [
        { x: 150, y: 540, kind: 'streetlamp', biome: 'cemetery' },
        { x: 340, y: 540, kind: 'tombstone', biome: 'cemetery' },
        { x: 460, y: 540, kind: 'dead_tree', biome: 'cemetery' },
        { x: 760, y: 485, kind: 'tombstone', biome: 'cemetery' },
        { x: 1310, y: 495, kind: 'iron_gate', biome: 'cemetery', scale: 1.05 },
        { x: 1960, y: 510, kind: 'streetlamp', biome: 'cemetery' },
        { x: 2240, y: 510, kind: 'tombstone', biome: 'cemetery' },
        { x: 3150, y: 495, kind: 'dead_tree', biome: 'cemetery' },
        { x: 3580, y: 495, kind: 'tombstone', biome: 'cemetery' },
      ],
      collectibles: [
        { id: 's2_c1', x: 410, y: 492, collected: false, bobOffset: 0.3, kind: 'diary_page' },
        { id: 's2_c2', x: 1480, y: 310, collected: false, bobOffset: 1.2, kind: 'diary_page' },
        { id: 's2_c3', x: 2135, y: 322, collected: false, bobOffset: 1.9, kind: 'oil_flask' },
        { id: 's2_c4', x: 2905, y: 358, collected: false, bobOffset: 0.8, kind: 'diary_page' },
        { id: 's2_c5', x: 3425, y: 302, collected: false, bobOffset: 2.1, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's2_cp1', x: 1925, y: 510, biome: 'cemetery', label: 'Capela do Cemitério', activated: false },
      ],
      monoliths: [
        {
          id: 's2_m1',
          x: 270,
          y: 540,
          title: 'Lápide Sem Nome',
          line: '“Os pacientes que nunca receberam alta foram enterrados sob a neblina. Alguns ainda caminham.”',
          triggered: false,
        },
        {
          id: 's2_m2',
          x: 2010,
          y: 510,
          title: 'Nota do Coveiro',
          line: '“Use [K] Clarão da Lanterna para cegar as aparições quando não houver onde se esconder.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s2_e1', 'crawler', 1560, 449, 1500, 1730),
        makeEnemy('s2_e2', 'crawler', 2220, 464, 2040, 2400),
        makeEnemy('s2_e3', 'wraith', 2630, 320, 2500, 2940),
        makeEnemy('s2_e4', 'crawler', 3460, 449, 3360, 3690),
      ],
      exitGate: { x: 3830, y: 495, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 3: CAPELA EM RUÍNAS ====================
  if (clamped === 2) {
    return {
      biome: 'chapel',
      worldWidth: 4100,
      fallLimitY: 780,
      platforms: [
        { id: 's3c_p1', x: -120, y: 540, w: 680, h: 240, biome: 'chapel', kind: 'ground' },
        { id: 's3c_p2', x: 660, y: 475, w: 220, h: 305, biome: 'chapel', kind: 'pillar' },
        { id: 's3c_l1', x: 960, y: 415, w: 180, h: 22, biome: 'chapel', kind: 'bridge', oneWay: true },
        { id: 's3c_p3', x: 1220, y: 495, w: 660, h: 285, biome: 'chapel', kind: 'ground' },
        { id: 's3c_l2', x: 1430, y: 375, w: 200, h: 22, biome: 'chapel', kind: 'ledge', oneWay: true },
        { id: 's3c_b1', x: 1960, y: 445, w: 180, h: 22, biome: 'chapel', kind: 'bridge', oneWay: true },
        { id: 's3c_p4', x: 2230, y: 490, w: 620, h: 290, biome: 'chapel', kind: 'ground' },
        { id: 's3c_l3', x: 2430, y: 370, w: 190, h: 22, biome: 'chapel', kind: 'ledge', oneWay: true },
        { id: 's3c_p5', x: 2940, y: 450, w: 200, h: 330, biome: 'chapel', kind: 'pillar' },
        { id: 's3c_p6', x: 3240, y: 495, w: 860, h: 285, biome: 'chapel', kind: 'ground' },
      ],
      hazards: [
        { id: 's3c_h1', x: 1480, y: 481, w: 92, h: 16, kind: 'broken_glass' },
        { id: 's3c_h2', x: 3440, y: 481, w: 92, h: 16, kind: 'barbed_wire' },
      ],
      waterZones: [{ x: 540, y: 585, w: 690, h: 160, biome: 'chapel' }],
      props: [
        { x: 150, y: 540, kind: 'blood_candle', biome: 'chapel' },
        { x: 360, y: 540, kind: 'altar_cross', biome: 'chapel' },
        { x: 770, y: 475, kind: 'blood_candle', biome: 'chapel' },
        { x: 1320, y: 495, kind: 'altar_cross', biome: 'chapel' },
        { x: 1760, y: 495, kind: 'blood_candle', biome: 'chapel' },
        { x: 2330, y: 490, kind: 'iron_gate', biome: 'chapel', scale: 1.0 },
        { x: 3040, y: 450, kind: 'blood_candle', biome: 'chapel' },
        { x: 3620, y: 495, kind: 'altar_cross', biome: 'chapel' },
      ],
      collectibles: [
        { id: 's3c_c1', x: 430, y: 492, collected: false, bobOffset: 0.3, kind: 'diary_page' },
        { id: 's3c_c2', x: 1530, y: 322, collected: false, bobOffset: 1.1, kind: 'diary_page' },
        { id: 's3c_c3', x: 2050, y: 392, collected: false, bobOffset: 1.7, kind: 'oil_flask' },
        { id: 's3c_c4', x: 2525, y: 318, collected: false, bobOffset: 0.9, kind: 'diary_page' },
        { id: 's3c_c5', x: 3040, y: 395, collected: false, bobOffset: 2.4, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's3c_cp1', x: 2290, y: 490, biome: 'chapel', label: 'Altar dos Vitrais', activated: false },
      ],
      monoliths: [
        {
          id: 's3c_m1',
          x: 260,
          y: 540,
          title: 'Sermão Interrompido',
          line: '“Quando os sinos pararam de tocar, as sombras invadiram a nave. Mantenha-se atento às aparições nos arcos.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s3c_e1', 'crawler', 1640, 449, 1590, 1840),
        makeEnemy('s3c_e2', 'wraith', 2010, 310, 1880, 2240),
        makeEnemy('s3c_e3', 'crawler', 2580, 444, 2400, 2800),
        makeEnemy('s3c_e4', 'wraith', 3320, 325, 3160, 3560),
        makeEnemy('s3c_e5', 'crawler', 3600, 449, 3550, 3800),
      ],
      exitGate: { x: 3890, y: 495, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 4: ALA OESTE DO SANATÓRIO ====================
  if (clamped === 3) {
    return {
      biome: 'asylum',
      worldWidth: 4100,
      fallLimitY: 780,
      platforms: [
        { id: 's3_p1', x: -120, y: 540, w: 680, h: 240, biome: 'asylum', kind: 'ground' },
        { id: 's3_p2', x: 660, y: 480, w: 150, h: 300, biome: 'asylum', kind: 'pillar' },
        { id: 's3_p3', x: 910, y: 415, w: 160, h: 365, biome: 'asylum', kind: 'pillar' },
        { id: 's3_l1', x: 760, y: 290, w: 190, h: 22, biome: 'asylum', kind: 'ledge', oneWay: true },
        { id: 's3_p4', x: 1180, y: 500, w: 760, h: 280, biome: 'asylum', kind: 'ground' },
        { id: 's3_b1', x: 1420, y: 370, w: 230, h: 22, biome: 'asylum', kind: 'bridge', oneWay: true },
        { id: 's3_l2', x: 2040, y: 455, w: 160, h: 22, biome: 'asylum', kind: 'ledge', oneWay: true },
        { id: 's3_l3', x: 2290, y: 395, w: 170, h: 22, biome: 'asylum', kind: 'ledge', oneWay: true },
        { id: 's3_p5', x: 2560, y: 485, w: 720, h: 295, biome: 'asylum', kind: 'ground' },
        { id: 's3_l4', x: 2810, y: 335, w: 190, h: 22, biome: 'asylum', kind: 'ledge', oneWay: true },
        { id: 's3_p6', x: 3380, y: 455, w: 720, h: 325, biome: 'asylum', kind: 'ground' },
      ],
      hazards: [
        { id: 's3_h1', x: 1490, y: 486, w: 95, h: 16, kind: 'broken_glass' },
        { id: 's3_h2', x: 2860, y: 471, w: 100, h: 16, kind: 'broken_glass' },
      ],
      waterZones: [
        { x: 540, y: 585, w: 650, h: 160, biome: 'asylum' },
        { x: 1930, y: 575, w: 640, h: 160, biome: 'asylum' },
      ],
      props: [
        { x: 180, y: 540, kind: 'gurney', biome: 'asylum' },
        { x: 420, y: 540, kind: 'flicker_tube', biome: 'asylum' },
        { x: 1290, y: 500, kind: 'flicker_tube', biome: 'asylum' },
        { x: 1710, y: 500, kind: 'gurney', biome: 'asylum' },
        { x: 2670, y: 485, kind: 'hanging_chain', biome: 'asylum' },
        { x: 3090, y: 485, kind: 'flicker_tube', biome: 'asylum' },
        { x: 3560, y: 455, kind: 'gurney', biome: 'asylum' },
      ],
      collectibles: [
        { id: 's3_c1', x: 380, y: 492, collected: false, bobOffset: 0.4, kind: 'diary_page' },
        { id: 's3_c2', x: 855, y: 240, collected: false, bobOffset: 1.3, kind: 'oil_flask' },
        { id: 's3_c3', x: 1535, y: 320, collected: false, bobOffset: 2.0, kind: 'diary_page' },
        { id: 's3_c4', x: 2375, y: 345, collected: false, bobOffset: 1.1, kind: 'diary_page' },
        { id: 's3_c5', x: 2905, y: 285, collected: false, bobOffset: 2.5, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's3_cp1', x: 2620, y: 485, biome: 'asylum', label: 'Posto de Enfermagem', activated: false },
      ],
      monoliths: [
        {
          id: 's3_m1',
          x: 260,
          y: 540,
          title: 'Diário da Enfermeira Clara',
          line: '“Trancaram os pacientes na Ala Oeste durante o apagão. Um golpe [J] no momento certo rebate os orbes malditos.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s3_e1', 'wraith', 780, 340, 640, 990),
        makeEnemy('s3_e2', 'crawler', 1660, 454, 1600, 1900),
        makeEnemy('s3_e3', 'wraith', 1760, 340, 1400, 1840),
        makeEnemy('s3_e4', 'crawler', 3020, 439, 2980, 3230),
        makeEnemy('s3_e5', 'wraith', 3620, 330, 3420, 3820),
      ],
      exitGate: { x: 3900, y: 455, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 5: PAVILHÃO DA QUARENTENA ====================
  if (clamped === 4) {
    return {
      biome: 'asylum',
      worldWidth: 4250,
      fallLimitY: 780,
      platforms: [
        { id: 's5q_p1', x: -120, y: 530, w: 620, h: 250, biome: 'asylum', kind: 'ground' },
        { id: 's5q_b1', x: 590, y: 475, w: 180, h: 22, biome: 'asylum', kind: 'bridge', oneWay: true },
        { id: 's5q_p2', x: 860, y: 425, w: 210, h: 355, biome: 'asylum', kind: 'pillar' },
        { id: 's5q_p3', x: 1170, y: 495, w: 720, h: 285, biome: 'asylum', kind: 'ground' },
        { id: 's5q_l1', x: 1380, y: 375, w: 220, h: 22, biome: 'asylum', kind: 'ledge', oneWay: true },
        { id: 's5q_b2', x: 1980, y: 450, w: 170, h: 22, biome: 'asylum', kind: 'bridge', oneWay: true },
        { id: 's5q_b3', x: 2240, y: 395, w: 170, h: 22, biome: 'asylum', kind: 'bridge', oneWay: true },
        { id: 's5q_p4', x: 2510, y: 485, w: 780, h: 295, biome: 'asylum', kind: 'ground' },
        { id: 's5q_l2', x: 2760, y: 365, w: 200, h: 22, biome: 'asylum', kind: 'ledge', oneWay: true },
        { id: 's5q_p5', x: 3390, y: 465, w: 860, h: 315, biome: 'asylum', kind: 'ground' },
      ],
      hazards: [
        { id: 's5q_h1', x: 1410, y: 481, w: 96, h: 16, kind: 'broken_glass' },
        { id: 's5q_h2', x: 2810, y: 471, w: 96, h: 16, kind: 'broken_glass' },
        { id: 's5q_h3', x: 3580, y: 451, w: 86, h: 16, kind: 'barbed_wire' },
      ],
      waterZones: [
        { x: 490, y: 585, w: 690, h: 160, biome: 'asylum' },
        { x: 1880, y: 580, w: 640, h: 160, biome: 'asylum' },
      ],
      props: [
        { x: 160, y: 530, kind: 'flicker_tube', biome: 'asylum' },
        { x: 350, y: 530, kind: 'gurney', biome: 'asylum' },
        { x: 1270, y: 495, kind: 'gurney', biome: 'asylum' },
        { x: 1710, y: 495, kind: 'flicker_tube', biome: 'asylum' },
        { x: 2630, y: 485, kind: 'flicker_tube', biome: 'asylum' },
        { x: 3120, y: 485, kind: 'hanging_chain', biome: 'asylum' },
        { x: 3740, y: 465, kind: 'gurney', biome: 'asylum' },
      ],
      collectibles: [
        { id: 's5q_c1', x: 680, y: 422, collected: false, bobOffset: 0.4, kind: 'diary_page' },
        { id: 's5q_c2', x: 1490, y: 322, collected: false, bobOffset: 1.2, kind: 'diary_page' },
        { id: 's5q_c3', x: 2325, y: 342, collected: false, bobOffset: 1.9, kind: 'oil_flask' },
        { id: 's5q_c4', x: 2860, y: 312, collected: false, bobOffset: 0.8, kind: 'diary_page' },
        { id: 's5q_c5', x: 3620, y: 380, collected: false, bobOffset: 2.2, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's5q_cp1', x: 1230, y: 495, biome: 'asylum', label: 'Ala de Isolamento', activated: false },
        { id: 's5q_cp2', x: 2575, y: 485, biome: 'asylum', label: 'Corredor Norte', activated: false },
      ],
      monoliths: [
        {
          id: 's5q_m1',
          x: 240,
          y: 530,
          title: 'Prontuário 14 · Quarentena',
          line: '“As portas de ferro selaram o pavilhão inteiro. Esquive com [Shift] para atravessar as investidas sem sofrer dano.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s5q_e1', 'wraith', 950, 295, 760, 1140),
        makeEnemy('s5q_e2', 'crawler', 1620, 449, 1530, 1850),
        makeEnemy('s5q_e3', 'wraith', 2140, 290, 1940, 2400),
        makeEnemy('s5q_e4', 'crawler', 3010, 439, 2930, 3250),
        makeEnemy('s5q_e5', 'wraith', 3760, 320, 3550, 3960),
      ],
      exitGate: { x: 4040, y: 465, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 6: MANSÃO DO DIRETOR ====================
  if (clamped === 5) {
    return {
      biome: 'mansion',
      worldWidth: 4300,
      fallLimitY: 780,
      platforms: [
        { id: 's6m_p1', x: -120, y: 525, w: 640, h: 255, biome: 'mansion', kind: 'ground' },
        { id: 's6m_l1', x: 240, y: 405, w: 180, h: 22, biome: 'mansion', kind: 'ledge', oneWay: true },
        { id: 's6m_b1', x: 610, y: 475, w: 190, h: 22, biome: 'mansion', kind: 'bridge', oneWay: true },
        { id: 's6m_p2', x: 890, y: 500, w: 740, h: 280, biome: 'mansion', kind: 'ground' },
        { id: 's6m_l2', x: 1160, y: 380, w: 210, h: 22, biome: 'mansion', kind: 'ledge', oneWay: true },
        { id: 's6m_p3', x: 1720, y: 445, w: 190, h: 335, biome: 'mansion', kind: 'pillar' },
        { id: 's6m_b2', x: 2010, y: 395, w: 180, h: 22, biome: 'mansion', kind: 'bridge', oneWay: true },
        { id: 's6m_p4', x: 2290, y: 490, w: 820, h: 290, biome: 'mansion', kind: 'ground' },
        { id: 's6m_l3', x: 2580, y: 370, w: 210, h: 22, biome: 'mansion', kind: 'ledge', oneWay: true },
        { id: 's6m_b3', x: 3210, y: 440, w: 180, h: 22, biome: 'mansion', kind: 'bridge', oneWay: true },
        { id: 's6m_p5', x: 3490, y: 480, w: 810, h: 300, biome: 'mansion', kind: 'ground' },
      ],
      hazards: [
        { id: 's6m_h1', x: 1170, y: 486, w: 92, h: 16, kind: 'broken_glass' },
        { id: 's6m_h2', x: 2630, y: 476, w: 100, h: 16, kind: 'broken_glass' },
      ],
      waterZones: [],
      props: [
        { x: 130, y: 525, kind: 'blood_candle', biome: 'mansion' },
        { x: 400, y: 525, kind: 'iron_gate', biome: 'mansion', scale: 0.95 },
        { x: 990, y: 500, kind: 'blood_candle', biome: 'mansion' },
        { x: 1470, y: 500, kind: 'hanging_chain', biome: 'mansion' },
        { x: 2410, y: 490, kind: 'blood_candle', biome: 'mansion' },
        { x: 2950, y: 490, kind: 'iron_gate', biome: 'mansion', scale: 1.0 },
        { x: 3650, y: 480, kind: 'blood_candle', biome: 'mansion' },
      ],
      collectibles: [
        { id: 's6m_c1', x: 330, y: 352, collected: false, bobOffset: 0.5, kind: 'diary_page' },
        { id: 's6m_c2', x: 1265, y: 328, collected: false, bobOffset: 1.3, kind: 'diary_page' },
        { id: 's6m_c3', x: 2100, y: 342, collected: false, bobOffset: 1.9, kind: 'oil_flask' },
        { id: 's6m_c4', x: 2685, y: 318, collected: false, bobOffset: 1.0, kind: 'diary_page' },
        { id: 's6m_c5', x: 3300, y: 388, collected: false, bobOffset: 2.3, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's6m_cp1', x: 950, y: 500, biome: 'mansion', label: 'Salão da Lareira', activated: false },
        { id: 's6m_cp2', x: 2350, y: 490, biome: 'mansion', label: 'Biblioteca Particular', activated: false },
      ],
      monoliths: [
        {
          id: 's6m_m1',
          x: 210,
          y: 525,
          title: 'Carta do Diretor Blackwood',
          line: '“Escondi a chave dos arquivos nos dutos do porão. Ninguém deve descer além das caldeiras sem luz de reserva.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s6m_e1', 'crawler', 1350, 454, 1280, 1590),
        makeEnemy('s6m_e2', 'wraith', 1810, 305, 1660, 2060),
        makeEnemy('s6m_e3', 'crawler', 2840, 444, 2750, 3070),
        makeEnemy('s6m_e4', 'wraith', 2980, 320, 2680, 3140),
        makeEnemy('s6m_e5', 'crawler', 3720, 434, 3540, 3960),
      ],
      exitGate: { x: 4090, y: 480, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 7: PORÃO E LABORATÓRIO ====================
  if (clamped === 6) {
    return {
      biome: 'lab',
      worldWidth: 4200,
      fallLimitY: 780,
      platforms: [
        { id: 's4_p1', x: -120, y: 520, w: 620, h: 260, biome: 'lab', kind: 'ground' },
        { id: 's4_b1', x: 600, y: 475, w: 170, h: 22, biome: 'lab', kind: 'bridge', oneWay: true },
        { id: 's4_b2', x: 870, y: 415, w: 170, h: 22, biome: 'lab', kind: 'bridge', oneWay: true },
        { id: 's4_l1', x: 1120, y: 350, w: 190, h: 22, biome: 'lab', kind: 'ledge', oneWay: true },
        { id: 's4_p2', x: 1380, y: 495, w: 660, h: 285, biome: 'lab', kind: 'ground' },
        { id: 's4_l2', x: 1620, y: 355, w: 200, h: 22, biome: 'lab', kind: 'ledge', oneWay: true },
        { id: 's4_p3', x: 2150, y: 455, w: 210, h: 325, biome: 'lab', kind: 'pillar' },
        { id: 's4_b3', x: 2460, y: 405, w: 170, h: 22, biome: 'lab', kind: 'bridge', oneWay: true },
        { id: 's4_p4', x: 2740, y: 480, w: 720, h: 300, biome: 'lab', kind: 'ground' },
        { id: 's4_l3', x: 2980, y: 335, w: 200, h: 22, biome: 'lab', kind: 'ledge', oneWay: true },
        { id: 's4_p5', x: 3560, y: 445, w: 640, h: 335, biome: 'lab', kind: 'ground' },
      ],
      hazards: [
        { id: 's4_h1', x: 1580, y: 481, w: 90, h: 16, kind: 'broken_glass' },
        { id: 's4_h2', x: 1810, y: 481, w: 80, h: 16, kind: 'broken_glass' },
        { id: 's4_h3', x: 3020, y: 466, w: 110, h: 16, kind: 'broken_glass' },
      ],
      waterZones: [
        { x: 490, y: 565, w: 900, h: 160, biome: 'lab' },
        { x: 2030, y: 570, w: 720, h: 160, biome: 'lab' },
      ],
      props: [
        { x: 170, y: 520, kind: 'flicker_tube', biome: 'lab' },
        { x: 360, y: 520, kind: 'hanging_chain', biome: 'lab' },
        { x: 1470, y: 495, kind: 'gurney', biome: 'lab' },
        { x: 1920, y: 495, kind: 'flicker_tube', biome: 'lab' },
        { x: 2250, y: 455, kind: 'hanging_chain', biome: 'lab' },
        { x: 2840, y: 480, kind: 'flicker_tube', biome: 'lab' },
        { x: 3310, y: 480, kind: 'gurney', biome: 'lab' },
        { x: 3690, y: 445, kind: 'hanging_chain', biome: 'lab' },
      ],
      collectibles: [
        { id: 's4_c1', x: 685, y: 425, collected: false, bobOffset: 0.4, kind: 'diary_page' },
        { id: 's4_c2', x: 1215, y: 298, collected: false, bobOffset: 1.2, kind: 'oil_flask' },
        { id: 's4_c3', x: 1720, y: 305, collected: false, bobOffset: 1.8, kind: 'diary_page' },
        { id: 's4_c4', x: 2545, y: 352, collected: false, bobOffset: 0.9, kind: 'diary_page' },
        { id: 's4_c5', x: 3080, y: 282, collected: false, bobOffset: 2.3, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's4_cp1', x: 1440, y: 495, biome: 'lab', label: 'Sala das Caldeiras', activated: false },
        { id: 's4_cp2', x: 2795, y: 480, biome: 'lab', label: 'Laboratório Submerso', activated: false },
      ],
      monoliths: [
        {
          id: 's4_m1',
          x: 250,
          y: 520,
          title: 'Registro 22 · O Porão',
          line: '“A água tomou as caldeiras. Saltar pelas passarelas sem cair exige calma — e muita luz.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s4_e1', 'wraith', 960, 300, 740, 1140),
        makeEnemy('s4_e2', 'crawler', 1710, 449, 1680, 1800),
        makeEnemy('s4_e3', 'wraith', 2260, 310, 2100, 2500),
        makeEnemy('s4_e4', 'crawler', 3220, 434, 3140, 3420),
        makeEnemy('s4_e5', 'wraith', 3680, 320, 3580, 3920),
      ],
      exitGate: { x: 4000, y: 445, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 8: DUTOS DO ESGOTO ESCURO ====================
  if (clamped === 7) {
    return {
      biome: 'lab',
      worldWidth: 4350,
      fallLimitY: 780,
      platforms: [
        { id: 's8l_p1', x: -120, y: 515, w: 580, h: 265, biome: 'lab', kind: 'ground' },
        { id: 's8l_p2', x: 560, y: 470, w: 180, h: 310, biome: 'lab', kind: 'pillar' },
        { id: 's8l_b1', x: 830, y: 420, w: 170, h: 22, biome: 'lab', kind: 'bridge', oneWay: true },
        { id: 's8l_p3', x: 1090, y: 495, w: 740, h: 285, biome: 'lab', kind: 'ground' },
        { id: 's8l_l1', x: 1360, y: 375, w: 200, h: 22, biome: 'lab', kind: 'ledge', oneWay: true },
        { id: 's8l_p4', x: 1920, y: 445, w: 170, h: 335, biome: 'lab', kind: 'pillar' },
        { id: 's8l_p5', x: 2180, y: 395, w: 170, h: 385, biome: 'lab', kind: 'pillar' },
        { id: 's8l_p6', x: 2450, y: 485, w: 820, h: 295, biome: 'lab', kind: 'ground' },
        { id: 's8l_l2', x: 2740, y: 365, w: 200, h: 22, biome: 'lab', kind: 'ledge', oneWay: true },
        { id: 's8l_b2', x: 3370, y: 435, w: 180, h: 22, biome: 'lab', kind: 'bridge', oneWay: true },
        { id: 's8l_p7', x: 3650, y: 460, w: 700, h: 320, biome: 'lab', kind: 'ground' },
      ],
      hazards: [
        { id: 's8l_h1', x: 1380, y: 481, w: 95, h: 16, kind: 'broken_glass' },
        { id: 's8l_h2', x: 2790, y: 471, w: 105, h: 16, kind: 'blood_spikes' },
      ],
      waterZones: [
        { x: 450, y: 560, w: 650, h: 160, biome: 'lab' },
        { x: 1820, y: 560, w: 640, h: 160, biome: 'lab' },
        { x: 3260, y: 565, w: 400, h: 160, biome: 'lab' },
      ],
      props: [
        { x: 140, y: 515, kind: 'hanging_chain', biome: 'lab' },
        { x: 320, y: 515, kind: 'flicker_tube', biome: 'lab' },
        { x: 1180, y: 495, kind: 'flicker_tube', biome: 'lab' },
        { x: 1680, y: 495, kind: 'hanging_chain', biome: 'lab' },
        { x: 2560, y: 485, kind: 'flicker_tube', biome: 'lab' },
        { x: 3080, y: 485, kind: 'hanging_chain', biome: 'lab' },
        { x: 3780, y: 460, kind: 'flicker_tube', biome: 'lab' },
      ],
      collectibles: [
        { id: 's8l_c1', x: 650, y: 418, collected: false, bobOffset: 0.4, kind: 'diary_page' },
        { id: 's8l_c2', x: 1460, y: 322, collected: false, bobOffset: 1.2, kind: 'diary_page' },
        { id: 's8l_c3', x: 2265, y: 342, collected: false, bobOffset: 2.0, kind: 'oil_flask' },
        { id: 's8l_c4', x: 2840, y: 312, collected: false, bobOffset: 0.9, kind: 'diary_page' },
        { id: 's8l_c5', x: 3460, y: 382, collected: false, bobOffset: 2.5, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's8l_cp1', x: 1140, y: 495, biome: 'lab', label: 'Comporta Leste', activated: false },
        { id: 's8l_cp2', x: 2510, y: 485, biome: 'lab', label: 'Galeria de Drenagem', activated: false },
      ],
      monoliths: [
        {
          id: 's8l_m1',
          x: 220,
          y: 515,
          title: 'Bilhete da Manutenção',
          line: '“A comporta para as catacumbas fica além dos canais inundados. Cuidado com os pilares escorregadios.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s8l_e1', 'wraith', 860, 290, 680, 1060),
        makeEnemy('s8l_e2', 'crawler', 1580, 449, 1495, 1790),
        makeEnemy('s8l_e3', 'wraith', 2140, 285, 1940, 2400),
        makeEnemy('s8l_e4', 'crawler', 2980, 439, 2910, 3230),
        makeEnemy('s8l_e5', 'wraith', 3790, 325, 3660, 4030),
      ],
      exitGate: { x: 4140, y: 460, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 9: CATACUMBAS DO PÊNDULO ====================
  if (clamped === 8) {
    return {
      biome: 'crypt',
      worldWidth: 4250,
      fallLimitY: 780,
      platforms: [
        { id: 's5_p1', x: -120, y: 480, w: 660, h: 300, biome: 'crypt', kind: 'ground' },
        { id: 's5_l1', x: 220, y: 350, w: 180, h: 22, biome: 'crypt', kind: 'ledge', oneWay: true },
        { id: 's5_b1', x: 640, y: 430, w: 200, h: 22, biome: 'crypt', kind: 'bridge', oneWay: true },
        { id: 's5_p2', x: 940, y: 465, w: 720, h: 315, biome: 'crypt', kind: 'ground' },
        { id: 's5_l2', x: 1180, y: 325, w: 210, h: 22, biome: 'crypt', kind: 'ledge', oneWay: true },
        { id: 's5_p3', x: 1760, y: 430, w: 180, h: 350, biome: 'crypt', kind: 'pillar' },
        { id: 's5_p4', x: 2040, y: 380, w: 180, h: 400, biome: 'crypt', kind: 'pillar' },
        { id: 's5_p5', x: 2330, y: 470, w: 780, h: 310, biome: 'crypt', kind: 'ground' },
        { id: 's5_l3', x: 2620, y: 330, w: 210, h: 22, biome: 'crypt', kind: 'ledge', oneWay: true },
        { id: 's5_b2', x: 3210, y: 425, w: 180, h: 22, biome: 'crypt', kind: 'bridge', oneWay: true },
        { id: 's5_p6', x: 3490, y: 480, w: 760, h: 300, biome: 'crypt', kind: 'ground' },
      ],
      hazards: [
        { id: 's5_h1', x: 1160, y: 451, w: 95, h: 16, kind: 'blood_spikes' },
        { id: 's5_h2', x: 1410, y: 451, w: 95, h: 16, kind: 'blood_spikes' },
        { id: 's5_h3', x: 2640, y: 456, w: 110, h: 16, kind: 'blood_spikes' },
      ],
      waterZones: [],
      props: [
        { x: 140, y: 480, kind: 'blood_candle', biome: 'crypt' },
        { x: 420, y: 480, kind: 'hanging_chain', biome: 'crypt' },
        { x: 1050, y: 465, kind: 'blood_candle', biome: 'crypt' },
        { x: 1550, y: 465, kind: 'altar_cross', biome: 'crypt' },
        { x: 1845, y: 430, kind: 'hanging_chain', biome: 'crypt' },
        { x: 2440, y: 470, kind: 'blood_candle', biome: 'crypt' },
        { x: 2940, y: 470, kind: 'altar_cross', biome: 'crypt' },
        { x: 3620, y: 480, kind: 'blood_candle', biome: 'crypt' },
      ],
      collectibles: [
        { id: 's5_c1', x: 310, y: 298, collected: false, bobOffset: 0.5, kind: 'diary_page' },
        { id: 's5_c2', x: 740, y: 378, collected: false, bobOffset: 1.4, kind: 'diary_page' },
        { id: 's5_c3', x: 1285, y: 272, collected: false, bobOffset: 2.1, kind: 'oil_flask' },
        { id: 's5_c4', x: 2130, y: 328, collected: false, bobOffset: 1.0, kind: 'diary_page' },
        { id: 's5_c5', x: 2725, y: 278, collected: false, bobOffset: 2.6, kind: 'diary_page' },
      ],
      checkpoints: [
        { id: 's5_cp1', x: 995, y: 465, biome: 'crypt', label: 'Altar das Correntes', activated: false },
        { id: 's5_cp2', x: 2390, y: 470, biome: 'crypt', label: 'Galerias de Calcário', activated: false },
      ],
      monoliths: [
        {
          id: 's5_m1',
          x: 380,
          y: 480,
          title: 'Último Aviso do Diretor',
          line: '“Abaixo do sanatório jaz a cripta mais antiga. O Carcereiro aguarda após o próximo portão.”',
          triggered: false,
        },
      ],
      enemies: [
        makeEnemy('s5_e1', 'crawler', 1290, 419, 1265, 1395),
        makeEnemy('s5_e2', 'wraith', 1520, 320, 1200, 1630),
        makeEnemy('s5_e3', 'crawler', 2500, 424, 2400, 2620),
        makeEnemy('s5_e4', 'wraith', 2840, 310, 2540, 3040),
        makeEnemy('s5_e5', 'crawler', 3680, 434, 3530, 3890),
      ],
      exitGate: { x: 4050, y: 480, unlocked: true, openProgress: 0 },
    };
  }

  // ==================== FASE 10: SANTUÁRIO DO CARCEREIRO (BOSS FINALE) ====================
  return {
    biome: 'crypt',
    worldWidth: 3100,
    fallLimitY: 780,
    platforms: [
      { id: 's6_p1', x: -120, y: 500, w: 680, h: 280, biome: 'crypt', kind: 'ground' },
      { id: 's6_b1', x: 650, y: 465, w: 180, h: 22, biome: 'crypt', kind: 'bridge', oneWay: true },
      { id: 's6_p2', x: 920, y: 505, w: 420, h: 275, biome: 'crypt', kind: 'ground' },
      // Arena do Carcereiro
      { id: 's6_arena', x: 1340, y: 520, w: 1140, h: 260, biome: 'crypt', kind: 'ground' },
      { id: 's6_al', x: 1520, y: 375, w: 190, h: 22, biome: 'crypt', kind: 'ledge', oneWay: true },
      { id: 's6_ar', x: 2110, y: 375, w: 190, h: 22, biome: 'crypt', kind: 'ledge', oneWay: true },
      // Portão da Alvorada
      { id: 's6_exit', x: 2480, y: 480, w: 620, h: 300, biome: 'crypt', kind: 'ground' },
    ],
    hazards: [],
    waterZones: [],
    props: [
      { x: 140, y: 500, kind: 'blood_candle', biome: 'crypt' },
      { x: 420, y: 500, kind: 'hanging_chain', biome: 'crypt' },
      { x: 1020, y: 505, kind: 'blood_candle', biome: 'crypt' },
      { x: 1440, y: 520, kind: 'blood_candle', biome: 'crypt' },
      { x: 1900, y: 520, kind: 'altar_cross', biome: 'crypt' },
      { x: 2380, y: 520, kind: 'blood_candle', biome: 'crypt' },
      { x: 2630, y: 480, kind: 'altar_cross', biome: 'crypt' },
    ],
    collectibles: [
      { id: 's6_c1', x: 740, y: 412, collected: false, bobOffset: 0.5, kind: 'diary_page' },
      { id: 's6_c2', x: 1615, y: 325, collected: false, bobOffset: 1.3, kind: 'oil_flask' },
      { id: 's6_c3', x: 2205, y: 325, collected: false, bobOffset: 2.1, kind: 'oil_flask' },
    ],
    checkpoints: [
      { id: 's6_cp1', x: 1060, y: 505, biome: 'crypt', label: 'Vigília Final', activated: false },
    ],
    monoliths: [
      {
        id: 's6_m1',
        x: 310,
        y: 500,
        title: 'Juramento da Vigília',
        line: '“À frente repousa o Carcereiro. Use as plataformas laterais para evitar seus impactos e acerte quando sua lâmina descansar.”',
        triggered: false,
      },
    ],
    enemies: [
      makeEnemy('boss_warden', 'warden', 2140, 412, 1410, 2410),
    ],
    exitGate: { x: 2760, y: 480, unlocked: false, openProgress: 0 },
  };
}
