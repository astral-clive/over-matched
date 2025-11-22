/**
 * Heroes Data Configuration
 * 
 * HOW TO ADD NEW HEROES:
 * 1. Add a new entry to the HEROES array below
 * 2. Use a lowercase, hyphenated id (e.g., "soldier-76")
 * 3. Set the role: "tank", "damage", or "support"
 * 4. Define strongAgainst: array of hero ids this hero counters
 * 5. Define weakAgainst: array of hero ids that counter this hero
 * 6. Define synergizesWith: array of hero ids that work well with this hero
 * 7. Set generalTierScore: 0-100 (higher = stronger in current meta)
 * 8. Optionally add mapAffinity: types of maps this hero excels on
 * 9. Optionally set difficulty: "easy", "medium", or "hard"
 */

export type Role = "tank" | "damage" | "support";

export interface HeroMeta {
  id: string;
  name: string;
  role: Role;
  strongAgainst: string[];      // Hero ids this hero counters
  weakAgainst: string[];         // Hero ids that counter this hero
  synergizesWith: string[];      // Hero ids that synergize well
  mapAffinity?: string[];        // Map types: "control", "hybrid", "payload", "flashpoint", "close-quarters", "long-range"
  generalTierScore: number;      // 0-100, baseline meta strength
  difficulty?: "easy" | "medium" | "hard";
}

export const HEROES: HeroMeta[] = [
  // ============ TANKS ============
  {
    id: "reinhardt",
    name: "Reinhardt",
    role: "tank",
    strongAgainst: ["reaper", "genji", "tracer"],
    weakAgainst: ["reaper", "bastion", "junkrat", "pharah"],
    synergizesWith: ["ana", "lucio", "reaper", "mei"],
    mapAffinity: ["control", "hybrid", "close-quarters"],
    generalTierScore: 72,
    difficulty: "easy",
  },
  {
    id: "winston",
    name: "Winston",
    role: "tank",
    strongAgainst: ["widowmaker", "ana", "zenyatta", "genji"],
    weakAgainst: ["reaper", "roadhog", "bastion"],
    synergizesWith: ["dva", "genji", "tracer", "lucio"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 75,
    difficulty: "medium",
  },
  {
    id: "dva",
    name: "D.Va",
    role: "tank",
    strongAgainst: ["widowmaker", "pharah", "soldier-76", "bastion"],
    weakAgainst: ["zarya", "mei", "symmetra"],
    synergizesWith: ["winston", "genji", "tracer"],
    mapAffinity: ["control", "hybrid"],
    generalTierScore: 78,
    difficulty: "medium",
  },
  {
    id: "ramattra",
    name: "Ramattra",
    role: "tank",
    strongAgainst: ["genji", "tracer", "winston"],
    weakAgainst: ["reaper", "bastion", "junkrat"],
    synergizesWith: ["ana", "kiriko", "reaper"],
    mapAffinity: ["control", "hybrid", "close-quarters"],
    generalTierScore: 80,
    difficulty: "hard",
  },
  {
    id: "roadhog",
    name: "Roadhog",
    role: "tank",
    strongAgainst: ["winston", "tracer", "genji"],
    weakAgainst: ["ana", "reaper", "mei"],
    synergizesWith: ["ana", "kiriko", "cassidy"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 68,
    difficulty: "medium",
  },
  {
    id: "zarya",
    name: "Zarya",
    role: "tank",
    strongAgainst: ["dva", "winston", "genji"],
    weakAgainst: ["pharah", "widowmaker", "echo"],
    synergizesWith: ["reinhardt", "reaper", "genji", "hanzo"],
    mapAffinity: ["control", "hybrid"],
    generalTierScore: 76,
    difficulty: "hard",
  },

  // ============ DAMAGE ============
  {
    id: "reaper",
    name: "Reaper",
    role: "damage",
    strongAgainst: ["roadhog", "winston", "reinhardt", "ramattra"],
    weakAgainst: ["pharah", "widowmaker", "echo"],
    synergizesWith: ["reinhardt", "lucio", "ana"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 70,
    difficulty: "easy",
  },
  {
    id: "soldier-76",
    name: "Soldier: 76",
    role: "damage",
    strongAgainst: ["pharah", "echo", "mercy"],
    weakAgainst: ["dva", "genji", "widowmaker"],
    synergizesWith: ["ana", "mercy", "reinhardt"],
    mapAffinity: ["hybrid", "payload", "long-range"],
    generalTierScore: 73,
    difficulty: "easy",
  },
  {
    id: "cassidy",
    name: "Cassidy",
    role: "damage",
    strongAgainst: ["tracer", "genji", "pharah"],
    weakAgainst: ["widowmaker", "hanzo", "pharah"],
    synergizesWith: ["ana", "mercy", "reinhardt"],
    mapAffinity: ["hybrid", "payload"],
    generalTierScore: 71,
    difficulty: "medium",
  },
  {
    id: "genji",
    name: "Genji",
    role: "damage",
    strongAgainst: ["widowmaker", "ana", "zenyatta"],
    weakAgainst: ["winston", "zarya", "mei", "symmetra"],
    synergizesWith: ["winston", "dva", "ana", "mercy"],
    mapAffinity: ["control", "hybrid"],
    generalTierScore: 74,
    difficulty: "hard",
  },
  {
    id: "pharah",
    name: "Pharah",
    role: "damage",
    strongAgainst: ["junkrat", "reaper", "reinhardt", "roadhog"],
    weakAgainst: ["soldier-76", "cassidy", "widowmaker", "dva"],
    synergizesWith: ["mercy", "ana", "baptiste"],
    mapAffinity: ["control", "hybrid", "long-range"],
    generalTierScore: 72,
    difficulty: "medium",
  },
  {
    id: "tracer",
    name: "Tracer",
    role: "damage",
    strongAgainst: ["widowmaker", "ana", "zenyatta"],
    weakAgainst: ["cassidy", "roadhog", "mei", "torbjorn"],
    synergizesWith: ["winston", "dva", "lucio"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 77,
    difficulty: "hard",
  },
  {
    id: "widowmaker",
    name: "Widowmaker",
    role: "damage",
    strongAgainst: ["pharah", "echo", "zenyatta", "ana"],
    weakAgainst: ["winston", "dva", "genji", "tracer"],
    synergizesWith: ["mercy", "baptiste"],
    mapAffinity: ["hybrid", "payload", "long-range"],
    generalTierScore: 75,
    difficulty: "hard",
  },
  {
    id: "bastion",
    name: "Bastion",
    role: "damage",
    strongAgainst: ["reinhardt", "winston", "ramattra"],
    weakAgainst: ["genji", "tracer", "hanzo", "pharah"],
    synergizesWith: ["baptiste", "mercy", "orisa"],
    mapAffinity: ["payload", "hybrid"],
    generalTierScore: 65,
    difficulty: "easy",
  },
  {
    id: "junkrat",
    name: "Junkrat",
    role: "damage",
    strongAgainst: ["reinhardt", "zarya", "bastion"],
    weakAgainst: ["pharah", "widowmaker", "echo"],
    synergizesWith: ["reinhardt", "zarya", "lucio"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 69,
    difficulty: "easy",
  },

  // ============ SUPPORTS ============
  {
    id: "ana",
    name: "Ana",
    role: "support",
    strongAgainst: ["roadhog", "pharah", "reinhardt"],
    weakAgainst: ["winston", "dva", "genji", "tracer"],
    synergizesWith: ["reinhardt", "zarya", "genji", "reaper"],
    mapAffinity: ["hybrid", "payload", "long-range"],
    generalTierScore: 82,
    difficulty: "hard",
  },
  {
    id: "kiriko",
    name: "Kiriko",
    role: "support",
    strongAgainst: ["roadhog", "widowmaker"],
    weakAgainst: ["winston", "dva"],
    synergizesWith: ["genji", "tracer", "reaper", "ramattra"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 85,
    difficulty: "hard",
  },
  {
    id: "lucio",
    name: "Lucio",
    role: "support",
    strongAgainst: ["reinhardt", "roadhog"],
    weakAgainst: ["pharah", "widowmaker", "cassidy"],
    synergizesWith: ["reinhardt", "winston", "dva", "reaper"],
    mapAffinity: ["control", "close-quarters"],
    generalTierScore: 79,
    difficulty: "medium",
  },
  {
    id: "mercy",
    name: "Mercy",
    role: "support",
    strongAgainst: [],
    weakAgainst: ["winston", "genji", "tracer", "widowmaker"],
    synergizesWith: ["pharah", "genji", "widowmaker", "soldier-76"],
    mapAffinity: ["hybrid", "payload"],
    generalTierScore: 76,
    difficulty: "easy",
  },
  {
    id: "zenyatta",
    name: "Zenyatta",
    role: "support",
    strongAgainst: ["roadhog", "zarya", "ramattra"],
    weakAgainst: ["winston", "genji", "tracer", "widowmaker"],
    synergizesWith: ["reinhardt", "zarya"],
    mapAffinity: ["hybrid", "payload", "long-range"],
    generalTierScore: 73,
    difficulty: "medium",
  },
  {
    id: "baptiste",
    name: "Baptiste",
    role: "support",
    strongAgainst: ["pharah", "genji"],
    weakAgainst: ["widowmaker", "hanzo"],
    synergizesWith: ["bastion", "soldier-76", "pharah"],
    mapAffinity: ["hybrid", "payload"],
    generalTierScore: 77,
    difficulty: "medium",
  },
];

// Create a lookup map for quick access by hero id
export const HERO_BY_ID = HEROES.reduce((acc, hero) => {
  acc[hero.id] = hero;
  return acc;
}, {} as Record<string, HeroMeta>);

// Helper to get heroes by role
export function getHeroesByRole(role: Role): HeroMeta[] {
  return HEROES.filter(h => h.role === role);
}

