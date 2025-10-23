import { spawnSync } from "node:child_process";

export function isCommandAvailable(command: string): boolean {
  let cmdName: string;
  let args: string[];

  if (process.platform === "win32") {
    cmdName = "where";
    args = [command];
  } else {
    cmdName = "which";
    args = [command];
  }

  const cmd = spawnSync(cmdName, args, { encoding: "utf-8" });

  if (!cmd.stdout || cmd.stdout.toString().trim() === "") {
    return false;
  }

  return true;
}
