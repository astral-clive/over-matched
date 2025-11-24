/**
 * Heroes Data Configuration
 *
 * HOW TO ADD NEW HEROES:
 * 1. Add a new entry to the HEROES array below
 * 2. Use a lowercase, hyphenated id (e.g., "soldier-76")
 * 3. Set the role: "tank", "damage", or "support"
 * 4. Add image: URL to hero portrait (use CDN or /public folder)
 * 5. Define strongAgainst: array of hero ids this hero counters
 * 6. Define weakAgainst: array of hero ids that counter this hero
 * 7. Define synergizesWith: array of hero ids that work well with this hero
 * 8. Set generalTierScore: 0-100 (higher = stronger in current meta)
 * 9. Optionally add mapAffinity: types of maps this hero excels on
 * 10. Optionally set difficulty: "easy", "medium", or "hard"
 */

export type Role = 'tank' | 'damage' | 'support';

export interface HeroMeta {
  id: string;
  name: string;
  role: Role;
  image: string; // Hero portrait image URL
  strongAgainst: string[]; // Hero ids this hero counters
  weakAgainst: string[]; // Hero ids that counter this hero
  synergizesWith: string[]; // Hero ids that synergize well
  mapAffinity?: string[]; // Map types: "control", "hybrid", "payload", "flashpoint", "close-quarters", "long-range"
  generalTierScore: number; // 0-100, baseline meta strength
  difficulty?: 'easy' | 'medium' | 'hard';
}

type HeroOverrides = Partial<Omit<HeroMeta, 'id' | 'name' | 'role'>>;

interface HeroDefinition {
  id: string;
  name: string;
  role: Role;
}

const HERO_ROSTER: HeroDefinition[] = [
  // Supports
  { id: 'ana', name: 'Ana', role: 'support' },
  { id: 'baptiste', name: 'Baptiste', role: 'support' },
  { id: 'brigitte', name: 'Brigitte', role: 'support' },
  { id: 'illari', name: 'Illari', role: 'support' },
  { id: 'juno', name: 'Juno', role: 'support' },
  { id: 'kiriko', name: 'Kiriko', role: 'support' },
  { id: 'lifeweaver', name: 'Lifeweaver', role: 'support' },
  { id: 'lucio', name: 'Lucio', role: 'support' },
  { id: 'mercy', name: 'Mercy', role: 'support' },
  { id: 'moira', name: 'Moira', role: 'support' },
  { id: 'zenyatta', name: 'Zenyatta', role: 'support' },

  // Damage
  { id: 'ashe', name: 'Ashe', role: 'damage' },
  { id: 'bastion', name: 'Bastion', role: 'damage' },
  { id: 'cassidy', name: 'Cassidy', role: 'damage' },
  { id: 'echo', name: 'Echo', role: 'damage' },
  { id: 'genji', name: 'Genji', role: 'damage' },
  { id: 'hanzo', name: 'Hanzo', role: 'damage' },
  { id: 'hazard', name: 'Hazard', role: 'tank' },
  { id: 'junkrat', name: 'Junkrat', role: 'damage' },
  { id: 'mei', name: 'Mei', role: 'damage' },
  { id: 'pharah', name: 'Pharah', role: 'damage' },
  { id: 'reaper', name: 'Reaper', role: 'damage' },
  { id: 'sojourn', name: 'Sojourn', role: 'damage' },
  { id: 'soldier-76', name: 'Soldier: 76', role: 'damage' },
  { id: 'sombra', name: 'Sombra', role: 'damage' },
  { id: 'symmetra', name: 'Symmetra', role: 'damage' },
  { id: 'torbjorn', name: 'Torbjörn', role: 'damage' },
  { id: 'tracer', name: 'Tracer', role: 'damage' },
  { id: 'venture', name: 'Venture', role: 'damage' },
  { id: 'widowmaker', name: 'Widowmaker', role: 'damage' },

  // Tanks
  { id: 'dva', name: 'D.Va', role: 'tank' },
  { id: 'doomfist', name: 'Doomfist', role: 'tank' },
  { id: 'freja', name: 'Freja', role: 'damage' },
  { id: 'junker-queen', name: 'Junker Queen', role: 'tank' },
  { id: 'mauga', name: 'Mauga', role: 'tank' },
  { id: 'orisa', name: 'Orisa', role: 'tank' },
  { id: 'ramattra', name: 'Ramattra', role: 'tank' },
  { id: 'reinhardt', name: 'Reinhardt', role: 'tank' },
  { id: 'roadhog', name: 'Roadhog', role: 'tank' },
  { id: 'sigma', name: 'Sigma', role: 'tank' },
  { id: 'winston', name: 'Winston', role: 'tank' },
  { id: 'wrecking-ball', name: 'Wrecking Ball', role: 'tank' },
  { id: 'wuyang', name: 'Wuyang', role: 'support' },
  { id: 'zarya', name: 'Zarya', role: 'tank' },
];

const HERO_IMAGE_BY_ID: Record<string, string> = {
  // Supports
  ana: '/heroes/Icon-Ana.webp',
  baptiste: '/heroes/Icon-Baptiste.png',
  brigitte: '/heroes/Icon-Brigitte.webp',
  illari: '/heroes/Icon-Illari.webp',
  juno: '/heroes/Icon-Juno.webp',
  kiriko: '/heroes/Icon-kiriko.webp',
  lifeweaver: '/heroes/Icon-Lifeweaver.webp',
  lucio: '/heroes/Icon-Lúcio.png',
  mercy: '/heroes/Icon-Mercy.png',
  moira: '/heroes/Icon-Moira.webp',
  zenyatta: '/heroes/Icon-Zenyatta.webp',

  // Damage
  ashe: '/heroes/Icon-Ashe.webp',
  bastion: '/heroes/Icon-Bastion.webp',
  cassidy: '/heroes/Icon-Cassidy.webp',
  echo: '/heroes/Icon-Echo.webp',
  genji: '/heroes/Icon-Genji.webp',
  hanzo: '/heroes/Icon-Hanzo.webp',
  hazard: '/heroes/Icon-Hazard.webp',
  junkrat: '/heroes/Icon-Junkrat.webp',
  mei: '/heroes/Icon-Mei.webp',
  pharah: '/heroes/Icon-Pharah.webp',
  reaper: '/heroes/Icon-Reaper.webp',
  sojourn: '/heroes/Icon-Sojourn.webp',
  'soldier-76': '/heroes/Icon-Soldier_76.webp',
  sombra: '/heroes/Icon-Sombra.webp',
  symmetra: '/heroes/Icon-Symmetra.webp',
  torbjorn: '/heroes/Icon-Torbjorn.webp',
  tracer: '/heroes/Icon-Tracer.webp',
  venture: '/heroes/Icon-Venture.webp',
  widowmaker: '/heroes/Icon-Widowmaker.webp',

  // Tanks
  dva: '/heroes/Icon-DVa.webp',
  doomfist: '/heroes/Icon-Doomfist.webp',
  freja: '/heroes/Icon-Freja.webp',
  'junker-queen': '/heroes/junker_queen.webp',
  mauga: '/heroes/mauga.webp',
  orisa: '/heroes/Icon-Orisa.webp',
  ramattra: '/heroes/Icon-Ramattra.webp',
  reinhardt: '/heroes/Icon-Reinhardt.webp',
  roadhog: '/heroes/Icon-Roadhog.webp',
  sigma: '/heroes/Icon-Sigma.webp',
  winston: '/heroes/Icon-Winston.webp',
  'wrecking-ball': '/heroes/Icon-Wrecking_Ball.webp',
  wuyang: '/heroes/Icon-Wuyang.webp',
  zarya: '/heroes/Icon-Zarya.webp',
};

const HERO_OVERRIDES: Record<string, HeroOverrides> = {
  reinhardt: {
    image: '/heroes/Icon-Reinhardt.webp',
    strongAgainst: ['reaper', 'genji', 'tracer'],
    weakAgainst: ['reaper', 'bastion', 'junkrat', 'pharah'],
    synergizesWith: ['ana', 'lucio', 'reaper', 'mei'],
    mapAffinity: ['control', 'hybrid', 'close-quarters'],
    generalTierScore: 72,
    difficulty: 'easy',
  },
  winston: {
    image: '/heroes/Icon-Winston.webp',
    strongAgainst: ['widowmaker', 'ana', 'zenyatta', 'genji'],
    weakAgainst: ['reaper', 'roadhog', 'bastion'],
    synergizesWith: ['dva', 'genji', 'tracer', 'lucio'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 75,
    difficulty: 'medium',
  },
  dva: {
    image: '/heroes/Icon-DVa.webp',
    strongAgainst: ['widowmaker', 'pharah', 'soldier-76', 'bastion'],
    weakAgainst: ['zarya', 'mei', 'symmetra'],
    synergizesWith: ['winston', 'genji', 'tracer'],
    mapAffinity: ['control', 'hybrid'],
    generalTierScore: 78,
    difficulty: 'medium',
  },
  ramattra: {
    image: '/heroes/Icon-Ramattra.webp',
    strongAgainst: ['genji', 'tracer', 'winston'],
    weakAgainst: ['reaper', 'bastion', 'junkrat'],
    synergizesWith: ['ana', 'kiriko', 'reaper'],
    mapAffinity: ['control', 'hybrid', 'close-quarters'],
    generalTierScore: 80,
    difficulty: 'hard',
  },
  roadhog: {
    image: '/heroes/Icon-Roadhog.webp',
    strongAgainst: ['winston', 'tracer', 'genji'],
    weakAgainst: ['ana', 'reaper', 'mei'],
    synergizesWith: ['ana', 'kiriko', 'cassidy'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 68,
    difficulty: 'medium',
  },
  zarya: {
    image: '/heroes/Icon-Zarya.webp',
    strongAgainst: ['dva', 'winston', 'genji'],
    weakAgainst: ['pharah', 'widowmaker', 'echo'],
    synergizesWith: ['reinhardt', 'reaper', 'genji', 'hanzo'],
    mapAffinity: ['control', 'hybrid'],
    generalTierScore: 76,
    difficulty: 'hard',
  },
  reaper: {
    image: '/heroes/Icon-Reaper.webp',
    strongAgainst: ['roadhog', 'winston', 'reinhardt', 'ramattra'],
    weakAgainst: ['pharah', 'widowmaker', 'echo'],
    synergizesWith: ['reinhardt', 'lucio', 'ana'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 70,
    difficulty: 'easy',
  },
  'soldier-76': {
    image: '/heroes/Icon-Soldier_76.webp',
    strongAgainst: ['pharah', 'echo', 'mercy'],
    weakAgainst: ['dva', 'genji', 'widowmaker'],
    synergizesWith: ['ana', 'mercy', 'reinhardt'],
    mapAffinity: ['hybrid', 'payload', 'long-range'],
    generalTierScore: 73,
    difficulty: 'easy',
  },
  cassidy: {
    image: '/heroes/Icon-Cassidy.webp',
    strongAgainst: ['tracer', 'genji', 'pharah'],
    weakAgainst: ['widowmaker', 'hanzo', 'pharah'],
    synergizesWith: ['ana', 'mercy', 'reinhardt'],
    mapAffinity: ['hybrid', 'payload'],
    generalTierScore: 71,
    difficulty: 'medium',
  },
  genji: {
    image: '/heroes/Icon-Genji.webp',
    strongAgainst: ['widowmaker', 'ana', 'zenyatta'],
    weakAgainst: ['winston', 'zarya', 'mei', 'symmetra'],
    synergizesWith: ['winston', 'dva', 'ana', 'mercy'],
    mapAffinity: ['control', 'hybrid'],
    generalTierScore: 74,
    difficulty: 'hard',
  },
  pharah: {
    image: '/heroes/Icon-Pharah.webp',
    strongAgainst: ['junkrat', 'reaper', 'reinhardt', 'roadhog'],
    weakAgainst: ['soldier-76', 'cassidy', 'widowmaker', 'dva'],
    synergizesWith: ['mercy', 'ana', 'baptiste'],
    mapAffinity: ['control', 'hybrid', 'long-range'],
    generalTierScore: 72,
    difficulty: 'medium',
  },
  tracer: {
    image: '/heroes/Icon-Tracer.webp',
    strongAgainst: ['widowmaker', 'ana', 'zenyatta'],
    weakAgainst: ['cassidy', 'roadhog', 'mei', 'torbjorn'],
    synergizesWith: ['winston', 'dva', 'lucio'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 77,
    difficulty: 'hard',
  },
  widowmaker: {
    image: '/heroes/Icon-Widowmaker.webp',
    strongAgainst: ['pharah', 'echo', 'zenyatta', 'ana'],
    weakAgainst: ['winston', 'dva', 'genji', 'tracer'],
    synergizesWith: ['mercy', 'baptiste'],
    mapAffinity: ['hybrid', 'payload', 'long-range'],
    generalTierScore: 75,
    difficulty: 'hard',
  },
  bastion: {
    image: '/heroes/Icon-Bastion.webp',
    strongAgainst: ['reinhardt', 'winston', 'ramattra'],
    weakAgainst: ['genji', 'tracer', 'hanzo', 'pharah'],
    synergizesWith: ['baptiste', 'mercy', 'orisa'],
    mapAffinity: ['payload', 'hybrid'],
    generalTierScore: 65,
    difficulty: 'easy',
  },
  junkrat: {
    image: '/heroes/Icon-Junkrat.webp',
    strongAgainst: ['reinhardt', 'zarya', 'bastion'],
    weakAgainst: ['pharah', 'widowmaker', 'echo'],
    synergizesWith: ['reinhardt', 'zarya', 'lucio'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 69,
    difficulty: 'easy',
  },
  ana: {
    image: '/heroes/Icon-Ana.webp',
    strongAgainst: ['roadhog', 'pharah', 'reinhardt'],
    weakAgainst: ['winston', 'dva', 'genji', 'tracer'],
    synergizesWith: ['reinhardt', 'zarya', 'genji', 'reaper'],
    mapAffinity: ['hybrid', 'payload', 'long-range'],
    generalTierScore: 82,
    difficulty: 'hard',
  },
  kiriko: {
    image: '/heroes/Icon-kiriko.webp',
    strongAgainst: ['roadhog', 'widowmaker'],
    weakAgainst: ['winston', 'dva'],
    synergizesWith: ['genji', 'tracer', 'reaper', 'ramattra'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 85,
    difficulty: 'hard',
  },
  lucio: {
    image: '/heroes/Icon-Lúcio.png',
    strongAgainst: ['reinhardt', 'roadhog'],
    weakAgainst: ['pharah', 'widowmaker', 'cassidy'],
    synergizesWith: ['reinhardt', 'winston', 'dva', 'reaper'],
    mapAffinity: ['control', 'close-quarters'],
    generalTierScore: 79,
    difficulty: 'medium',
  },
  mercy: {
    image: '/heroes/Icon-Mercy.png',
    strongAgainst: [],
    weakAgainst: ['winston', 'genji', 'tracer', 'widowmaker'],
    synergizesWith: ['pharah', 'genji', 'widowmaker', 'soldier-76'],
    mapAffinity: ['hybrid', 'payload'],
    generalTierScore: 76,
    difficulty: 'easy',
  },
  zenyatta: {
    image: '/heroes/Icon-Zenyatta.webp',
    strongAgainst: ['roadhog', 'zarya', 'ramattra'],
    weakAgainst: ['winston', 'genji', 'tracer', 'widowmaker'],
    synergizesWith: ['reinhardt', 'zarya'],
    mapAffinity: ['hybrid', 'payload', 'long-range'],
    generalTierScore: 73,
    difficulty: 'medium',
  },
  baptiste: {
    image: '/heroes/Icon-Baptiste.png',
    strongAgainst: ['pharah', 'genji'],
    weakAgainst: ['widowmaker', 'hanzo'],
    synergizesWith: ['bastion', 'soldier-76', 'pharah'],
    mapAffinity: ['hybrid', 'payload'],
    generalTierScore: 77,
    difficulty: 'medium',
  },
};

const DEFAULT_META: HeroOverrides = {
  image: '',
  strongAgainst: [],
  weakAgainst: [],
  synergizesWith: [],
  mapAffinity: [],
  generalTierScore: 70,
  difficulty: 'medium',
};

const cloneArray = (value?: string[]) => [...(value ?? [])];

export const HEROES: HeroMeta[] = HERO_ROSTER.map(hero => {
  const overrides = HERO_OVERRIDES[hero.id] ?? {};
  return {
    ...hero,
    image: overrides.image ?? HERO_IMAGE_BY_ID[hero.id] ?? DEFAULT_META.image ?? '',
    strongAgainst: cloneArray(overrides.strongAgainst ?? DEFAULT_META.strongAgainst),
    weakAgainst: cloneArray(overrides.weakAgainst ?? DEFAULT_META.weakAgainst),
    synergizesWith: cloneArray(overrides.synergizesWith ?? DEFAULT_META.synergizesWith),
    mapAffinity: cloneArray(overrides.mapAffinity ?? DEFAULT_META.mapAffinity),
    generalTierScore: overrides.generalTierScore ?? DEFAULT_META.generalTierScore ?? 70,
    difficulty: overrides.difficulty ?? DEFAULT_META.difficulty,
  };
});

// Create a lookup map for quick access by hero id
export const HERO_BY_ID = HEROES.reduce((acc, hero) => {
  acc[hero.id] = hero;
  return acc;
}, {} as Record<string, HeroMeta>);

// Helper to get heroes by role
export function getHeroesByRole(role: Role): HeroMeta[] {
  return HEROES.filter(h => h.role === role);
}
