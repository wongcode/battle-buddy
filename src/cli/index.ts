import { Command } from "commander";
import { gauntlet } from "./gauntlet";
import { host, join } from "./multiplayer";
import { loadRegisteredBuddy, saveTypeOverride, getClaudeCompanionName, getConfigPath } from "./config";
import { generateBuddy } from "../engine/generate";
import { prompt } from "./input";

const program = new Command();

program
  .name("battle-buddy")
  .description("Pokemon-like CLI battle game with companion buddies")
  .version("0.1.0");

program
  .command("gauntlet")
  .description("Solo gauntlet — fight a series of AI opponents")
  .action(async () => {
    await gauntlet();
  });

program
  .command("host")
  .description("Host a multiplayer battle — share the room code with a friend")
  .action(async () => {
    await host();
  });

program
  .command("join <code>")
  .description("Join a multiplayer battle with a room code")
  .action(async (code: string) => {
    await join(code);
  });

program
  .command("register")
  .description("Set your buddy's type (name is read from ~/.claude.json)")
  .action(async () => {
    const existing = loadRegisteredBuddy();
    if (existing) {
      console.log(`\nCurrent buddy: ${existing.name} [${existing.type}]`);
      const overwrite = await prompt("Overwrite? (y/n): ");
      if (overwrite.toLowerCase() !== "y") return;
    }
    const companionName = getClaudeCompanionName();
    const name = companionName ?? (await prompt("Buddy name: ")).trim();
    if (companionName) console.log(`Using Claude companion: ${companionName}`);
    const type = (await prompt("Buddy type (e.g. cactus, fern, bonsai): ")).trim().toLowerCase();
    const buddy = generateBuddy(name, type);
    saveTypeOverride(type);
    console.log(`\nRegistered ${buddy.name} [${buddy.type}]!`);
    console.log(`Saved to ${getConfigPath()}`);
  });

// Default: show help if no command
if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}
