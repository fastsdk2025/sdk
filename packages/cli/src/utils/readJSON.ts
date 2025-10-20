import { readFileSync } from "node:fs";

export function readJSON<T extends object>(filePath: string): T {
  try {
    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (e) {
    throw new Error(`Failed to read JSON file: ${filePath}`, { cause: e });
  }
}
