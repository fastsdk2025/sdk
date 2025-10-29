import { createLogger } from "@utils/logger";
import CommandBase from "@core/base/CommandBase";

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
        const upload = this.requireService("upload");

        upload.uploadFile(file, options.dest);
      });
  }
}
