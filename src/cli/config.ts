import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { BuddyDef } from "../engine/types";
import { generateBuddy } from "../engine/generate";

const CONFIG_PATH = path.join(os.homedir(), ".battle-buddy.json");

interface BuddyConfig {
  name: string;
  type: string;
  description: string;
}

export function loadRegisteredBuddy(): BuddyDef | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw) as BuddyConfig;
    if (cfg.name && cfg.type) {
      return generateBuddy(cfg.name, cfg.type, cfg.description ?? "");
    }
  } catch {
    // no config or invalid
  }
  return null;
}

export function saveRegisteredBuddy(
  name: string,
  type: string,
  description: string
): void {
  const cfg: BuddyConfig = { name, type, description };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
