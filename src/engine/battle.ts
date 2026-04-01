import { BuddyDef, BattleState, Fighter, MoveResult, StatusEffect } from "./types";
import { getMove } from "./moves";

// ── Init ────────────────────────────────────────────────

export function createFighter(buddy: BuddyDef): Fighter {
  return {
    buddy,
    currentHp: buddy.stats.hp,
    statusEffects: [],
    cooldowns: {},
  };
}

export function createBattle(buddy1: BuddyDef, buddy2: BuddyDef): BattleState {
  const f1 = createFighter(buddy1);
  const f2 = createFighter(buddy2);

  // Faster buddy goes first
  const firstIndex: 0 | 1 = buddy1.stats.speed >= buddy2.stats.speed ? 0 : 1;

  return {
    turn: 1,
    fighters: [f1, f2],
    activeIndex: firstIndex,
    log: [`Battle start! ${buddy1.name} vs ${buddy2.name}`],
    winner: null,
  };
}

// ── Stat helpers ────────────────────────────────────────

function getEffectiveStat(fighter: Fighter, stat: keyof BuddyDef["stats"]): number {
  let value = fighter.buddy.stats[stat];
  for (const effect of fighter.statusEffects) {
    if (effect.kind === "buff" && effect.stat === stat) {
      value += effect.amount;
    }
    if (effect.kind === "debuff" && effect.stat === stat) {
      value -= effect.amount;
    }
  }
  return Math.max(0, value);
}

function isStunned(fighter: Fighter): boolean {
  return fighter.statusEffects.some((e) => e.kind === "stun");
}

// ── Damage calc ─────────────────────────────────────────

function calcDamage(power: number, attack: number, defense: number): number {
  // Simple formula: power * (attack / (attack + defense)) with some variance
  const base = power * (attack / (attack + defense));
  const variance = 0.85 + Math.random() * 0.3; // 0.85–1.15
  return Math.max(1, Math.round(base * variance));
}

// ── Tick status effects ─────────────────────────────────

function tickStatusEffects(fighter: Fighter, messages: string[]): void {
  const remaining: StatusEffect[] = [];

  for (const effect of fighter.statusEffects) {
    if (effect.kind === "dot") {
      const dmg = effect.amount;
      fighter.currentHp = Math.max(0, fighter.currentHp - dmg);
      messages.push(`${fighter.buddy.name} takes ${dmg} damage from ${effect.source}!`);
    }

    effect.turnsLeft--;
    if (effect.turnsLeft > 0) {
      remaining.push(effect);
    } else {
      if (effect.kind === "buff") {
        messages.push(`${fighter.buddy.name}'s ${effect.stat} boost faded.`);
      } else if (effect.kind === "debuff") {
        messages.push(`${fighter.buddy.name}'s ${effect.stat} drop faded.`);
      } else if (effect.kind === "stun") {
        messages.push(`${fighter.buddy.name} is no longer stunned.`);
      }
    }
  }

  fighter.statusEffects = remaining;
}

// ── Cooldown tick ───────────────────────────────────────

function tickCooldowns(fighter: Fighter): void {
  for (const moveId of Object.keys(fighter.cooldowns)) {
    fighter.cooldowns[moveId]--;
    if (fighter.cooldowns[moveId] <= 0) {
      delete fighter.cooldowns[moveId];
    }
  }
}

// ── Apply a move ────────────────────────────────────────

export function applyMove(state: BattleState, moveId: string): MoveResult {
  const attIdx = state.activeIndex;
  const defIdx: 0 | 1 = attIdx === 0 ? 1 : 0;
  const attacker = state.fighters[attIdx];
  const defender = state.fighters[defIdx];
  const move = getMove(moveId);
  const messages: string[] = [];

  // Validate move belongs to attacker
  if (!attacker.buddy.moves.includes(moveId)) {
    throw new Error(`${attacker.buddy.name} doesn't know ${move.name}`);
  }

  // Check cooldown
  if (attacker.cooldowns[moveId]) {
    throw new Error(`${move.name} is on cooldown (${attacker.cooldowns[moveId]} turns)`);
  }

  // Check stun
  if (isStunned(attacker)) {
    messages.push(`${attacker.buddy.name} is stunned and can't move!`);
    return finishTurn(state, messages, {
      attacker: attacker.buddy.name,
      defender: defender.buddy.name,
      moveName: move.name,
      hit: false,
      damage: 0,
      messages,
    });
  }

  messages.push(`${attacker.buddy.name} uses ${move.name}!`);

  // Accuracy check
  const roll = Math.random() * 100;
  if (roll > move.accuracy) {
    messages.push(`It missed!`);
    if (move.cooldown > 0) {
      attacker.cooldowns[moveId] = move.cooldown;
    }
    return finishTurn(state, messages, {
      attacker: attacker.buddy.name,
      defender: defender.buddy.name,
      moveName: move.name,
      hit: false,
      damage: 0,
      messages,
    });
  }

  // Apply effect
  let totalDamage = 0;
  const eff = move.effect;

  switch (eff.kind) {
    case "damage": {
      const atk = getEffectiveStat(attacker, "attack");
      const def = getEffectiveStat(defender, "defense");
      const dmg = calcDamage(eff.power, atk, def);
      defender.currentHp = Math.max(0, defender.currentHp - dmg);
      totalDamage = dmg;
      messages.push(`${defender.buddy.name} takes ${dmg} damage!`);
      break;
    }
    case "dot": {
      defender.statusEffects.push({
        kind: "dot",
        amount: eff.power,
        turnsLeft: eff.turns,
        source: move.name,
      });
      messages.push(`${defender.buddy.name} is affected by ${move.name} for ${eff.turns} turns!`);
      break;
    }
    case "buff": {
      attacker.statusEffects.push({
        kind: "buff",
        stat: eff.stat,
        amount: eff.amount,
        turnsLeft: eff.turns,
        source: move.name,
      });
      messages.push(`${attacker.buddy.name}'s ${eff.stat} rose by ${eff.amount}!`);
      break;
    }
    case "debuff": {
      defender.statusEffects.push({
        kind: "debuff",
        stat: eff.stat,
        amount: eff.amount,
        turnsLeft: eff.turns,
        source: move.name,
      });
      messages.push(`${defender.buddy.name}'s ${eff.stat} fell by ${eff.amount}!`);
      break;
    }
    case "stun": {
      defender.statusEffects.push({
        kind: "stun",
        amount: 0,
        turnsLeft: eff.turns,
        source: move.name,
      });
      messages.push(`${defender.buddy.name} is stunned!`);
      break;
    }
    case "heal": {
      const heal = Math.min(eff.power, attacker.buddy.stats.hp - attacker.currentHp);
      attacker.currentHp += heal;
      messages.push(`${attacker.buddy.name} healed ${heal} HP!`);
      break;
    }
  }

  // Set cooldown
  if (move.cooldown > 0) {
    attacker.cooldowns[moveId] = move.cooldown;
  }

  return finishTurn(state, messages, {
    attacker: attacker.buddy.name,
    defender: defender.buddy.name,
    moveName: move.name,
    hit: true,
    damage: totalDamage,
    messages,
  });
}

// ── End-of-turn bookkeeping ─────────────────────────────

function finishTurn(
  state: BattleState,
  messages: string[],
  result: MoveResult
): MoveResult {
  const attIdx = state.activeIndex;
  const defIdx: 0 | 1 = attIdx === 0 ? 1 : 0;

  // Tick status effects on the defender (DOT, expiry)
  tickStatusEffects(state.fighters[defIdx], messages);

  // Check for KO
  if (state.fighters[0].currentHp <= 0) {
    state.winner = 1;
    messages.push(`${state.fighters[0].buddy.name} fainted! ${state.fighters[1].buddy.name} wins!`);
  } else if (state.fighters[1].currentHp <= 0) {
    state.winner = 0;
    messages.push(`${state.fighters[1].buddy.name} fainted! ${state.fighters[0].buddy.name} wins!`);
  }

  // Log everything
  state.log.push(...messages);

  // Advance turn
  if (state.winner === null) {
    // Tick cooldowns for attacker
    tickCooldowns(state.fighters[attIdx]);
    // Tick status effects for the attacker at end of their turn
    const attackerMsgs: string[] = [];
    tickStatusEffects(state.fighters[attIdx], attackerMsgs);
    state.log.push(...attackerMsgs);
    result.messages.push(...attackerMsgs);

    // Check KO again (DOT could KO the attacker)
    if (state.fighters[0].currentHp <= 0) {
      state.winner = 1;
      const msg = `${state.fighters[0].buddy.name} fainted! ${state.fighters[1].buddy.name} wins!`;
      state.log.push(msg);
      result.messages.push(msg);
    } else if (state.fighters[1].currentHp <= 0) {
      state.winner = 0;
      const msg = `${state.fighters[1].buddy.name} fainted! ${state.fighters[0].buddy.name} wins!`;
      state.log.push(msg);
      result.messages.push(msg);
    }

    state.activeIndex = defIdx;
    state.turn++;
  }

  return result;
}

// ── Queries ─────────────────────────────────────────────

export function getAvailableMoves(state: BattleState): string[] {
  const fighter = state.fighters[state.activeIndex];
  return fighter.buddy.moves.filter((id) => !fighter.cooldowns[id]);
}

export function isBattleOver(state: BattleState): boolean {
  return state.winner !== null;
}
