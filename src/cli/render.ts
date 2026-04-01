import { BattleState, Fighter } from "../engine/types";
import { getMove } from "../engine/moves";

// ── ANSI helpers ────────────────────────────────────────

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const CYAN = `${ESC}36m`;
const MAGENTA = `${ESC}35m`;

function hpColor(ratio: number): string {
  if (ratio > 0.5) return GREEN;
  if (ratio > 0.25) return YELLOW;
  return RED;
}

function hpBar(current: number, max: number, width = 20): string {
  const ratio = current / max;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const color = hpColor(ratio);
  return `${color}${"█".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
}

// ── Render battle state ─────────────────────────────────

export function renderBattle(state: BattleState): string {
  const [f1, f2] = state.fighters;
  const lines: string[] = [];

  lines.push("");
  lines.push(`${BOLD}${CYAN}[Turn ${state.turn}]${RESET} ${f1.buddy.name} vs. ${f2.buddy.name}`);
  lines.push("");

  lines.push(renderFighterStatus(f1, 0, state.activeIndex));
  lines.push(renderFighterStatus(f2, 1, state.activeIndex));
  lines.push("");

  return lines.join("\n");
}

function renderFighterStatus(fighter: Fighter, index: number, activeIndex: number): string {
  const max = fighter.buddy.stats.hp;
  const cur = fighter.currentHp;
  const pointer = index === activeIndex ? `${YELLOW}▸${RESET} ` : "  ";
  const bar = hpBar(cur, max);
  const statusIcons = fighter.statusEffects.map((e) => {
    switch (e.kind) {
      case "dot": return `${RED}☠${RESET}`;
      case "buff": return `${GREEN}↑${RESET}`;
      case "debuff": return `${RED}↓${RESET}`;
      case "stun": return `${YELLOW}✦${RESET}`;
    }
  }).join("");
  const statusStr = statusIcons ? ` ${statusIcons}` : "";

  return `${pointer}${BOLD}${fighter.buddy.name}${RESET} [${fighter.buddy.type}]  ${bar} ${cur}/${max}${statusStr}`;
}

// ── Render move menu ────────────────────────────────────

export function renderMoveMenu(state: BattleState): string {
  const fighter = state.fighters[state.activeIndex];
  const lines: string[] = [];

  lines.push(`${BOLD}Choose your move:${RESET}`);

  fighter.buddy.moves.forEach((moveId, i) => {
    const move = getMove(moveId);
    const onCooldown = fighter.cooldowns[moveId];
    const num = `  ${i + 1}.`;

    if (onCooldown) {
      lines.push(`${DIM}${num} ${move.name}  (cooldown: ${onCooldown} turns)${RESET}`);
    } else {
      const detail = formatMoveDetail(move);
      lines.push(`${num} ${BOLD}${move.name}${RESET}  ${DIM}${detail}${RESET}`);
    }
  });

  lines.push("");
  return lines.join("\n");
}

function formatMoveDetail(move: ReturnType<typeof getMove>): string {
  const eff = move.effect;
  const acc = `ACC: ${move.accuracy}%`;

  switch (eff.kind) {
    case "damage":
      return `(ATK: ${eff.power}, ${acc})`;
    case "dot":
      return `(DOT: ${eff.power}x${eff.turns}, ${acc})`;
    case "buff":
      return `(${eff.stat.toUpperCase()} +${eff.amount}, ${eff.turns}t)`;
    case "debuff":
      return `(${eff.stat.toUpperCase()} -${eff.amount}, ${eff.turns}t, ${acc})`;
    case "stun":
      return `(STUN ${eff.turns}t, ${acc})`;
    case "heal":
      return `(HEAL: ${eff.power})`;
  }
}

// ── Render event log ────────────────────────────────────

export function renderMessages(messages: string[]): string {
  return messages.map((m) => `  ${MAGENTA}▪${RESET} ${m}`).join("\n") + "\n";
}

// ── Render buddy select ─────────────────────────────────

export function renderBuddySelect(buddies: Array<{ id: string; name: string; type: string; description: string; stats: Record<string, number> }>): string {
  const lines: string[] = [];
  lines.push(`\n${BOLD}${CYAN}Choose your buddy:${RESET}\n`);

  buddies.forEach((b, i) => {
    lines.push(`  ${i + 1}. ${BOLD}${b.name}${RESET} [${b.type}]`);
    lines.push(`     ${DIM}${b.description}${RESET}`);
    const stats = Object.entries(b.stats)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join("  ");
    lines.push(`     ${DIM}${stats}${RESET}`);
    lines.push("");
  });

  return lines.join("\n");
}

// ── Victory screen ──────────────────────────────────────

export function renderVictory(winnerName: string): string {
  return `\n${BOLD}${GREEN}🏆 ${winnerName} wins the battle! 🏆${RESET}\n`;
}

export function renderDefeat(winnerName: string): string {
  return `\n${BOLD}${RED}💀 ${winnerName} wins. Better luck next time! 💀${RESET}\n`;
}
