import { getWorkerDir } from "./getWorkerDir";
import { XYXConfig } from "../types/xyx";
import { readJSON } from "./readJSON";
import { join } from "node:path";

export function getXYXConfig(base: string): XYXConfig {
  const projectBase = getWorkerDir(base, "xyx.config.json");
  if (!projectBase) {
    throw new Error(
      `Could not find xyx.config.json in ${base} or any parent directory`,
    );
  }

  const configPath = join(projectBase, "xyx.config.json");

  return readJSON<XYXConfig>(configPath);
}
