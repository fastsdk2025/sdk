import { readFileSync } from "node:fs";
import { getWorkerDir } from "./getWorkerDir";
import { XYXConfig } from "../types/xyx";

export function getXYXConfig(base: string): XYXConfig {
  const configPath = getWorkerDir(base, "xxy.config.json");
  if (!configPath) {
    throw new Error(
      `Could not find xxy.config.json in ${base} or any parent directory`,
    );
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as XYXConfig;
  } catch (error) {
    throw new Error(
      `Failed to parse xxy.config.json: ${(error as Error).message}`,
      {
        cause: error,
      },
    );
  }
}
