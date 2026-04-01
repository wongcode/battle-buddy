import { getBuddy, getAllBuddies, getBuddyIds } from "../engine/buddies";
import { createBattle, applyMove, getAvailableMoves, isBattleOver } from "../engine/battle";
import { BattleState } from "../engine/types";
import { getMove } from "../engine/moves";
import {
  renderBattle,
  renderMoveMenu,
  renderMessages,
  renderBuddySelect,
  renderVictory,
  renderDefeat,
} from "./render";
import { promptNumber } from "./input";

// ── AI move selection ───────────────────────────────────

function pickAiMove(state: BattleState): string {
  const available = getAvailableMoves(state);
  // Simple AI: pick randomly from available moves
  return available[Math.floor(Math.random() * available.length)];
}

// ── Single battle ───────────────────────────────────────

async function runBattle(playerBuddyId: string, opponentBuddyId: string): Promise<boolean> {
  const player = getBuddy(playerBuddyId);
  const opponent = getBuddy(opponentBuddyId);
  const state = createBattle(player, opponent);

  // Player is always fighter 0
  console.log(renderBattle(state));

  while (!isBattleOver(state)) {
    if (state.activeIndex === 0) {
      // Player turn
      console.log(renderMoveMenu(state));
      const fighter = state.fighters[0];
      const choice = await promptNumber("> ", 1, fighter.buddy.moves.length);
      const moveId = fighter.buddy.moves[choice - 1];

      if (fighter.cooldowns[moveId]) {
        console.log(`That move is on cooldown! Pick another.\n`);
        continue;
      }

      const result = applyMove(state, moveId);
      console.log(renderMessages(result.messages));
    } else {
      // AI turn
      const moveId = pickAiMove(state);
      const result = applyMove(state, moveId);
      console.log(renderMessages(result.messages));
    }

    if (!isBattleOver(state)) {
      console.log(renderBattle(state));
    }
  }

  const playerWon = state.winner === 0;
  if (playerWon) {
    console.log(renderVictory(player.name));
  } else {
    console.log(renderDefeat(opponent.name));
  }

  return playerWon;
}

// ── Gauntlet mode ───────────────────────────────────────

export async function gauntlet(): Promise<void> {
  console.log("\n⚔️  GAUNTLET MODE ⚔️");
  console.log("Defeat all opponents in a row to win!\n");

  // Buddy select
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
  const playerBuddyId = ids[choice - 1];

  // Opponents = everyone except player's pick
  const opponents = ids.filter((id) => id !== playerBuddyId);

  let wins = 0;
  for (const oppId of opponents) {
    const opp = getBuddy(oppId);
    console.log(`\n━━━ Round ${wins + 1}: vs ${opp.name} the ${opp.type} ━━━\n`);

    const won = await runBattle(playerBuddyId, oppId);
    if (!won) {
      console.log(`\nGauntlet over. You won ${wins}/${opponents.length} battles.\n`);
      return;
    }
    wins++;
  }

  console.log(`\n🎉 GAUNTLET COMPLETE! You defeated all ${wins} opponents! 🎉\n`);
}
