import { Command } from "commander";
import { uploader } from "./uploader";

const uploadCommand = new Command("upload")
  .argument("<file>", "Upload a file")
  .description("Upload files to the cloud")
  .action(async (file: string) => {
    await uploader(file)
  });

export default uploadCommand;
