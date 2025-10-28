import { version } from "../package.json";
import CleanCommand from "@commands/clean";
import ResultCommand from "@commands/result";
import UploadCommand from "@commands/upload";
import Kernel from "@core/Kernel";

async function main() {
  const program = new Kernel();

  program
    .name("fast")
    .alias("f")
    .description("A high-performance CLI for fast development")
    .version(version, "-V, --version");

  await program.boot()

  program.registerCommand(CleanCommand);
  program.registerCommand(ResultCommand);
  program.registerCommand(UploadCommand);

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
