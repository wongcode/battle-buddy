import { getBuddy, getAllBuddies, getBuddyIds } from "../engine/buddies";
import { BattleState } from "../engine/types";
import {
  renderBattle,
  renderMoveMenu,
  renderMessages,
  renderBuddySelect,
  renderVictory,
  renderDefeat,
} from "./render";
import { promptNumber } from "./input";
import { createRoom, joinRoom, pollState, submitMove } from "./client";

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const CYAN = `${ESC}36m`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function selectBuddy(): Promise<string> {
  const ids = getBuddyIds();
  const allBuddies = getAllBuddies();
  const selectData = ids.map((id) => ({
    id,
    name: allBuddies[id].name,
    type: allBuddies[id].type,
    description: allBuddies[id].description,
    stats: allBuddies[id].stats as unknown as Record<string, number>,
  }));
  console.log(renderBuddySelect(selectData));
  const choice = await promptNumber("> ", 1, ids.length);
  return ids[choice - 1];
}

// ── Shared battle loop ───────────────────────────────────

async function runMultiplayerBattle(
  code: string,
  token: string,
  initialState: BattleState,
  myIndex: 0 | 1
): Promise<void> {
  let state = initialState;
  let logOffset = state.log.length;

  console.log(renderBattle(state));

  while (state.winner === null) {
    if (state.activeIndex === myIndex) {
      // ── My turn ──
      console.log(renderMoveMenu(state));
      const fighter = state.fighters[myIndex];
      const allMoves = fighter.buddy.moves;

      let moveId: string | null = null;
      while (!moveId) {
        const choice = await promptNumber("> ", 1, allMoves.length);
        const candidate = allMoves[choice - 1];
        if (fighter.cooldowns[candidate]) {
          console.log("That move is on cooldown! Pick another.\n");
        } else {
          moveId = candidate;
        }
      }

      try {
        const { state: newState } = await submitMove(code, token, moveId);
        const newMessages = newState.log.slice(logOffset);
        logOffset = newState.log.length;
        if (newMessages.length > 0) console.log(renderMessages(newMessages));
        state = newState;
      } catch (e: unknown) {
        console.log(`Error: ${(e as Error).message}\n`);
        continue;
      }
    } else {
      // ── Opponent's turn: poll until state advances ──
      while (state.activeIndex !== myIndex && state.winner === null) {
        process.stdout.write("  Waiting for opponent...\r");
        await sleep(1000);

        let roomState;
        try {
          roomState = await pollState(code);
        } catch {
          continue;
        }

        if (!roomState.state) continue;

        const newState = roomState.state;
        if (newState.turn > state.turn || newState.winner !== null) {
          process.stdout.write("\r" + " ".repeat(30) + "\r");
          const newMessages = newState.log.slice(logOffset);
          logOffset = newState.log.length;
          if (newMessages.length > 0) console.log(renderMessages(newMessages));
          state = newState;
        }
      }
    }

    if (state.winner === null) {
      console.log(renderBattle(state));
    }
  }

  const myBuddy = state.fighters[myIndex].buddy;
  const opponentBuddy = state.fighters[myIndex === 0 ? 1 : 0].buddy;

  if (state.winner === myIndex) {
    console.log(renderVictory(myBuddy.name));
  } else {
    console.log(renderDefeat(opponentBuddy.name));
  }
}

// ── host ─────────────────────────────────────────────────

export async function host(): Promise<void> {
  console.log(`\n${BOLD}${CYAN}⚔️  HOST MODE${RESET}\n`);

  const buddyId = await selectBuddy();

  process.stdout.write("Creating room...");
  const { code, token } = await createRoom(buddyId);
  console.log(" done!\n");

  console.log(`  Room code: ${BOLD}${code}${RESET}`);
  console.log("  Share this code with your opponent.\n");
  console.log("Waiting for opponent to join...");

  while (true) {
    await sleep(1000);
    const { status, state } = await pollState(code);
    if (status === "active" && state) {
      console.log("Opponent joined! Battle starting!\n");
      await runMultiplayerBattle(code, token, state, 0);
      return;
    }
  }
}

// ── join ─────────────────────────────────────────────────

export async function join(code: string): Promise<void> {
  const upperCode = code.toUpperCase();
  console.log(`\n${BOLD}${CYAN}⚔️  JOIN MODE — Room: ${upperCode}${RESET}\n`);

  const buddyId = await selectBuddy();

  process.stdout.write("Connecting...");
  let token: string;
  let playerIndex: number;
  try {
    ({ token, playerIndex } = await joinRoom(upperCode, buddyId));
  } catch (e: unknown) {
    console.log(` failed: ${(e as Error).message}`);
    process.exit(1);
  }
  console.log(" connected!\n");

  const { state } = await pollState(upperCode);
  if (!state) {
    console.error("No battle state after joining.");
    process.exit(1);
  }

  console.log("Battle starting!\n");
  await runMultiplayerBattle(upperCode, token, state, playerIndex as 0 | 1);
}

// ── re-export buddy select for gauntlet ──────────────────
export { getBuddy };
