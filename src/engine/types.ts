// ── Core Types ──────────────────────────────────────────

export interface BuddyStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

export interface BuddyDef {
  name: string;
  type: string;
  description: string;
  stats: BuddyStats;
  moves: string[]; // move IDs
}

// ── Moves ───────────────────────────────────────────────

export type MoveEffect =
  | { kind: "damage"; power: number }
  | { kind: "dot"; power: number; turns: number }
  | { kind: "buff"; stat: keyof BuddyStats; amount: number; turns: number }
  | { kind: "debuff"; stat: keyof BuddyStats; amount: number; turns: number }
  | { kind: "stun"; turns: number }
  | { kind: "heal"; power: number };

export interface MoveDef {
  id: string;
  name: string;
  description: string;
  effect: MoveEffect;
  accuracy: number; // 0-100
  cooldown: number; // turns before reuse (0 = no cooldown)
}

// ── Battle State ────────────────────────────────────────

export interface StatusEffect {
  kind: "dot" | "buff" | "debuff" | "stun";
  stat?: keyof BuddyStats;
  amount: number;
  turnsLeft: number;
  source: string; // move ID that caused it
}

export interface Fighter {
  buddy: BuddyDef;
  currentHp: number;
  statusEffects: StatusEffect[];
  cooldowns: Record<string, number>; // moveId → turns remaining
}

export interface BattleState {
  turn: number;
  fighters: [Fighter, Fighter];
  activeIndex: 0 | 1; // whose turn it is
  log: string[];
  winner: 0 | 1 | null;
}

export interface MoveResult {
  attacker: string;
  defender: string;
  moveName: string;
  hit: boolean;
  damage: number;
  messages: string[];
}
