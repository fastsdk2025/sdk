import { mkdirSync } from "node:fs";

export function ensureDir(dirPath: string) {
  mkdirSync(dirPath, { recursive: true });
}
