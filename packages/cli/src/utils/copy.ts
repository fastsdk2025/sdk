import { spawnSync } from "node:child_process";
import { isCommandAvailable } from "./isCommandAvailable";

export function copy(content: string | Buffer): void {
  const input =
    typeof content === "string" ? Buffer.from(content, "utf8") : content;

  switch (process.platform) {
    case "win32":
      if (isCommandAvailable("clip")) {
        spawnSync("clip", { input });
      } else {
        throw new Error(
          // `Unable to execute command: clip. Please check whether the command is registered in the system environment variables.`,
          `❌ Command "clip" not found. Make sure it’s available in your system PATH.`,
        );
      }
      break;
    case "darwin":
      if (isCommandAvailable("pbcopy")) {
        spawnSync("pbcopy", { input });
      } else {
        throw new Error(
          // `Unable to execute command: pbcopy. Please check whether the command is registered in the system environment variables.`,
          `❌ Command "pbcopy" not found. Make sure it’s available in your system PATH.`,
          {
            cause: new Error("Command not found"),
          },
        );
      }
      break;
    default:
      if (isCommandAvailable("xclip")) {
        spawnSync("xclip", ["-selection", "clipboard"], { input });
      } else if (isCommandAvailable("xsel")) {
        spawnSync("xsel", ["-b"], { input });
      } else {
        throw new Error(
          // `Unable to execute command: xclip. Please check whether the command is registered in the system environment variables.`,
          `❌ Command "xclip" not found. Make sure it’s available in your system PATH.`,
          {
            cause: new Error("Command not found"),
          },
        );
      }
  }
}
