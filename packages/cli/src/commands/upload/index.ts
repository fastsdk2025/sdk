import { Command } from "commander";
import { uploader } from "./uploader";
import { createLogger } from "@utils/logger";
import CommandBase from "@/core/CommandBase";

const logger = createLogger("info", "UploadCommand");

export default class UploadCommand extends CommandBase {
  onEnable(): void {
    this.program
      .name("upload")
      .argument("<file>", "Upload a file")
      .description("Upload files to the cloud")
      .option(
        "-d, --dest <destination>",
        "Destination object name in the bucket (defaults to basename)",
      )
      .action(async (file: string, options: { dest?: string }) => {
        try {
          const url = await uploader(file, options.dest);
          logger.info("Upload succeeded: ", url);
        } catch (error) {
          logger.error((error as Error).message);
          process.exit(1);
        }
      });
  }
}
