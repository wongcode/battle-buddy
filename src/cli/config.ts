import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { BuddyDef } from "../engine/types";
import { generateBuddy } from "../engine/generate";

const CLAUDE_JSON = path.join(os.homedir(), ".claude.json");
const CONFIG_PATH = path.join(os.homedir(), ".battle-buddy.json");

interface ClaudeCompanion {
  name: string;
  personality?: string;
  hatchedAt?: number;
}

interface BuddyConfig {
  type?: string; // optional override; auto-detected if absent
}

// ── Type detection from personality text ─────────────────

const TYPE_KEYWORDS: [string, string[]][] = [
  ["cactus",   ["prickly", "cactus", "spine", "desert", "drought", "succulent"]],
  ["fern",     ["fern", "frond", "woodland", "leafy"]],
  ["bonsai",   ["bonsai", "branch", "bark", "timber", "ancient", "miniature"]],
  ["mushroom", ["mushroom", "fungal", "spore", "mycelium", "decompose"]],
  ["flower",   ["flower", "bloom", "petal", "blossom"]],
  ["vine",     ["vine", "creeper", "tendril", "climbing"]],
  ["moss",     ["moss", "lichen", "damp", "shade"]],
];

function detectType(personality: string): string | null {
  const lower = personality.toLowerCase();
  for (const [type, keywords] of TYPE_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return type;
  }
  return null;
}

// ── Read Claude companion from ~/.claude.json ─────────────

function readClaudeCompanion(): ClaudeCompanion | null {
  try {
    const raw = fs.readFileSync(CLAUDE_JSON, "utf8");
    const data = JSON.parse(raw) as { companion?: ClaudeCompanion };
    if (data.companion?.name) return data.companion;
  } catch {
    // file missing or unreadable
  }
  return null;
}

// ── Read type override from ~/.battle-buddy.json ──────────

function readTypeOverride(): string | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw) as BuddyConfig;
    return cfg.type ?? null;
  } catch {
    return null;
  }
}

export function saveTypeOverride(type: string): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ type }, null, 2));
}

// ── Public API ────────────────────────────────────────────

export interface ResolvedBuddy {
  buddy: BuddyDef;
  detectedType: boolean; // false = type was prompted/overridden
}

export function loadRegisteredBuddy(): BuddyDef | null {
  const companion = readClaudeCompanion();
  if (!companion) return null;

  const typeOverride = readTypeOverride();
  const autoType = companion.personality ? detectType(companion.personality) : null;
  const type = typeOverride ?? autoType;

  if (!type) return null; // caller must prompt for type

  return generateBuddy(
    companion.name,
    type,
    companion.personality ?? ""
  );
}

export function getClaudeCompanionName(): string | null {
  return readClaudeCompanion()?.name ?? null;
}

export function getDetectedType(): string | null {
  const companion = readClaudeCompanion();
  const typeOverride = readTypeOverride();
  if (typeOverride) return typeOverride;
  if (companion?.personality) return detectType(companion.personality);
  return null;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

// Legacy: kept for the `register` command
export function saveRegisteredBuddy(
  name: string,
  type: string,
  description: string
): void {
  fs.writeFileSync(
    CONFIG_PATH,
    JSON.stringify({ type, _note: `name/description come from ~/.claude.json companion` }, null, 2)
  );
  void name; void description; // sourced from Claude config
}
