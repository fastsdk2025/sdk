import { exec, execSync } from "node:child_process";
import os from "node:os";

export function copy(content: string): void {
  const platform = os.platform();

  if (platform === "win32") {
    execSync(`echo "${content}" | clip`);
  } else if (platform === "darwin") {
    execSync(`echo "${content}" | pbcopy`);
  } else {
    exec(`echo "${content}" | xclip -selection clipboard`);
  }
}
