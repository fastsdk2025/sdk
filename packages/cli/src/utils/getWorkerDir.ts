import { existsSync } from "node:fs";
import { join } from "node:path";
import { findParent } from "./findParent";

export function getWorkerDir(base: string, path: string) {
  const basePath = findParent(base, (dir) => {
    console.log(join(dir, path));
    return existsSync(join(dir, path));
  });

  return basePath;
}
