import { Command } from "commander";
import { gauntlet } from "./gauntlet";
import { host, join } from "./multiplayer";

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

// Default: show help if no command
if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}
