import * as process from "node:process";
import { spawnSync } from "node:child_process"

export function isCommandAvailable(command: string) {
  let cmdName: string;
  let args: string[];

  if (process.platform === "win32") {
    cmdName = "where";
    args = [command];
  } else {
    cmdName = "which";
    args = [command];
  }

  const cmd = spawnSync(cmdName, args, {
    encoding: "utf-8"
  });

  return !!cmd.stdout || cmd.stdout.toString() === ""
}