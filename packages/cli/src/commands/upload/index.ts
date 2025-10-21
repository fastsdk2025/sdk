import { Command } from "commander";

const uploadCommand = new Command("upload")
  .argument("<file>", "Upload a file")
  .description("Upload files to the cloud")
  .action(async () => {
    console.log("Uploading files...");
  });

export default uploadCommand;
