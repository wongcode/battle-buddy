import { MoveDef } from "./types";

const moves: Record<string, MoveDef> = {
  // ── Cactus (Rook) ──────────────────────────────────────
  spine_shot: {
    id: "spine_shot",
    name: "Spine Shot",
    description: "Fast volley of needles",
    effect: { kind: "damage", power: 25 },
    accuracy: 95,
    cooldown: 0,
  },
  drought_drain: {
    id: "drought_drain",
    name: "Drought Drain",
    description: "Sap moisture over time",
    effect: { kind: "dot", power: 10, turns: 3 },
    accuracy: 80,
    cooldown: 2,
  },
  sand_shield: {
    id: "sand_shield",
    name: "Sand Shield",
    description: "Coat in protective sand",
    effect: { kind: "buff", stat: "defense", amount: 20, turns: 3 },
    accuracy: 100,
    cooldown: 3,
  },
  bloom_burst: {
    id: "bloom_burst",
    name: "Bloom Burst",
    description: "Explosive desert bloom",
    effect: { kind: "damage", power: 55 },
    accuracy: 85,
    cooldown: 3,
  },

  // ── Fern (Fernsby) ─────────────────────────────────────
  frond_whip: {
    id: "frond_whip",
    name: "Frond Whip",
    description: "Lash with a sharp frond",
    effect: { kind: "damage", power: 30 },
    accuracy: 90,
    cooldown: 0,
  },
  spore_cloud: {
    id: "spore_cloud",
    name: "Spore Cloud",
    description: "Daze with toxic spores",
    effect: { kind: "stun", turns: 1 },
    accuracy: 60,
    cooldown: 3,
  },
  photosynthesis: {
    id: "photosynthesis",
    name: "Photosynthesis",
    description: "Bask in light to heal",
    effect: { kind: "heal", power: 25 },
    accuracy: 100,
    cooldown: 2,
  },
  vine_crush: {
    id: "vine_crush",
    name: "Vine Crush",
    description: "Constrict with powerful vines",
    effect: { kind: "damage", power: 45 },
    accuracy: 80,
    cooldown: 2,
  },

  // ── Bonsai (Bonsly) ────────────────────────────────────
  branch_snap: {
    id: "branch_snap",
    name: "Branch Snap",
    description: "Crack a hardened branch",
    effect: { kind: "damage", power: 35 },
    accuracy: 90,
    cooldown: 0,
  },
  root_grip: {
    id: "root_grip",
    name: "Root Grip",
    description: "Hold foe in place with roots",
    effect: { kind: "stun", turns: 1 },
    accuracy: 65,
    cooldown: 3,
  },
  bark_armor: {
    id: "bark_armor",
    name: "Bark Armor",
    description: "Toughen outer bark",
    effect: { kind: "buff", stat: "defense", amount: 25, turns: 2 },
    accuracy: 100,
    cooldown: 3,
  },
  timber_slam: {
    id: "timber_slam",
    name: "Timber Slam",
    description: "Full-body slam like a falling tree",
    effect: { kind: "damage", power: 60 },
    accuracy: 75,
    cooldown: 3,
  },

  // ── Mushroom (Sporex) ──────────────────────────────────
  cap_bash: {
    id: "cap_bash",
    name: "Cap Bash",
    description: "Headbutt with a thick cap",
    effect: { kind: "damage", power: 28 },
    accuracy: 92,
    cooldown: 0,
  },
  toxic_spore: {
    id: "toxic_spore",
    name: "Toxic Spore",
    description: "Release a poisonous cloud",
    effect: { kind: "dot", power: 12, turns: 3 },
    accuracy: 85,
    cooldown: 2,
  },
  mycelium_net: {
    id: "mycelium_net",
    name: "Mycelium Net",
    description: "Slow the foe with fungal threads",
    effect: { kind: "debuff", stat: "speed", amount: 20, turns: 3 },
    accuracy: 80,
    cooldown: 2,
  },
  decompose: {
    id: "decompose",
    name: "Decompose",
    description: "Break down foe's defenses",
    effect: { kind: "debuff", stat: "defense", amount: 25, turns: 2 },
    accuracy: 75,
    cooldown: 3,
  },

  // ── Generic (unknown type fallback) ───────────────────
  basic_strike: {
    id: "basic_strike",
    name: "Basic Strike",
    description: "A straightforward attack",
    effect: { kind: "damage", power: 30 },
    accuracy: 90,
    cooldown: 0,
  },
  fortify: {
    id: "fortify",
    name: "Fortify",
    description: "Brace for incoming hits",
    effect: { kind: "buff", stat: "defense", amount: 20, turns: 3 },
    accuracy: 100,
    cooldown: 3,
  },
  drain_touch: {
    id: "drain_touch",
    name: "Drain Touch",
    description: "Sap energy over time",
    effect: { kind: "dot", power: 8, turns: 3 },
    accuracy: 85,
    cooldown: 2,
  },
  power_surge: {
    id: "power_surge",
    name: "Power Surge",
    description: "Unleash a burst of energy",
    effect: { kind: "damage", power: 50 },
    accuracy: 80,
    cooldown: 3,
  },
  quick_jab: {
    id: "quick_jab",
    name: "Quick Jab",
    description: "A fast, light hit",
    effect: { kind: "damage", power: 20 },
    accuracy: 98,
    cooldown: 0,
  },
  root_bind: {
    id: "root_bind",
    name: "Root Bind",
    description: "Immobilize the opponent briefly",
    effect: { kind: "stun", turns: 1 },
    accuracy: 60,
    cooldown: 3,
  },
};

export function getMove(id: string): MoveDef {
  const move = moves[id];
  if (!move) throw new Error(`Unknown move: ${id}`);
  return move;
}

export function getAllMoves(): Record<string, MoveDef> {
  return { ...moves };
}
