import { getWorkerDir } from "./getWorkerDir";
import { XYXConfig } from "../types/xyx";
import { readJSON } from "./readJSON";
import { join } from "node:path";

export function getXYXConfig(base: string): XYXConfig {
  const configPath = getWorkerDir(base, "xyx.config.json");
  if (!configPath) {
    throw new Error(
      `Could not find xyx.config.json in ${base} or any parent directory`,
    );
  }

  return readJSON<XYXConfig>(join(configPath, "xyx.config.json"));
}
