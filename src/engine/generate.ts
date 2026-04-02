import { BuddyDef, BuddyStats } from "./types";

// ── Deterministic hash (FNV-1a 32-bit) ──────────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// ── Type → stat modifiers ────────────────────────────────

const TYPE_PROFILES: Record<string, Partial<Record<keyof BuddyStats, number>>> = {
  cactus:    { defense: +15, special: +10, speed: -15 },
  fern:      { speed: +15, attack: +10, defense: -15 },
  bonsai:    { attack: +12, defense: +12, special: -12 },
  mushroom:  { special: +15, hp: +10, attack: -12 },
  flower:    { special: +12, speed: +8, defense: -10 },
  vine:      { attack: +10, hp: +10, speed: -8 },
  moss:      { defense: +10, hp: +15, attack: -12 },
  succulent: { defense: +12, hp: +8, speed: -10 },
  bamboo:    { speed: +12, attack: +8, hp: -10 },
  pine:      { hp: +12, defense: +8, special: -10 },
};

// ── Type → move pool ─────────────────────────────────────

const TYPE_MOVES: Record<string, string[]> = {
  cactus:   ["spine_shot", "drought_drain", "sand_shield", "bloom_burst"],
  fern:     ["frond_whip", "spore_cloud", "photosynthesis", "vine_crush"],
  bonsai:   ["branch_snap", "root_grip", "bark_armor", "timber_slam"],
  mushroom: ["cap_bash", "toxic_spore", "mycelium_net", "decompose"],
};

// Fallback pool for unknown types — picks 4 based on name hash
const GENERIC_POOL = [
  "basic_strike",
  "fortify",
  "drain_touch",
  "power_surge",
  "quick_jab",
  "root_bind",
];

const STAT_KEYS: (keyof BuddyStats)[] = ["hp", "attack", "defense", "speed", "special"];

// ── Generate a BuddyDef from name + type ─────────────────

export function generateBuddy(
  name: string,
  type: string,
  description = ""
): BuddyDef {
  const normalType = type.toLowerCase().trim();
  const seed = hash(name.toLowerCase() + normalType);

  // Base stats: each 45–85, derived from seed bits
  const stats: BuddyStats = { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 };
  STAT_KEYS.forEach((k, i) => {
    const bits = (seed >>> (i * 6)) & 0x3f; // 0–63
    stats[k] = 45 + Math.round((bits / 63) * 40);
  });

  // Apply type profile
  const profile = TYPE_PROFILES[normalType] ?? {};
  for (const [k, delta] of Object.entries(profile)) {
    const key = k as keyof BuddyStats;
    stats[key] = Math.max(20, Math.min(100, stats[key] + (delta as number)));
  }

  // Pick moves
  let moves: string[];
  if (TYPE_MOVES[normalType]) {
    moves = TYPE_MOVES[normalType];
  } else {
    // Pick 4 from generic pool using seed
    const shuffled = [...GENERIC_POOL].sort(
      (a, b) => (hash(seed + a.length) % 100) - (hash(seed + b.length) % 100)
    );
    moves = shuffled.slice(0, 4);
  }

  return {
    name,
    type: normalType,
    description: description || `A ${normalType} buddy.`,
    stats,
    moves,
  };
}
