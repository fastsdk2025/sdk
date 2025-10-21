import { writeFileSync } from "node:fs";
import { ensureDir } from "./ensureDir";
import { dirname } from "node:path";

export function writeJSON(filePath: string, data: object, prettify = true) {
  try {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, JSON.stringify(data, null, prettify ? 2 : 0));
  } catch (error) {
    throw new Error(`Failed to write JSON file: ${filePath}`, { cause: error });
  }
}
