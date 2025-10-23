import { Command } from "commander";
import { version } from "../package.json";
import cleanCommand from "@commands/clean";
import resultCommand from "@commands/result";
import uploadCommand from "@commands/upload";

async function main() {
  const program = new Command();

  program
    .name("fast")
    .alias("f")
    .description("A high-performance CLI for fast development")
    .version(version, "-V, --version");

  program.addCommand(cleanCommand);
  program.addCommand(resultCommand);
  program.addCommand(uploadCommand);

  if (process.argv.slice(2).length === 0) {
    program.outputHelp();
    process.exit(0);
  }

  await program.parseAsync(process.argv);
}

main().catch((e) => {
  console.error("An error occurred:", e);
  process.exit(1);
});
