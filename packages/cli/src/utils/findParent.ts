import { dirname } from "node:path";

export type ComparisonFunction = (basePath: string) => boolean;

export function findParent(
  basePath: string,
  comparison: ComparisonFunction,
  fallback?: string,
) {
  if (comparison(basePath)) {
    return basePath;
  }

  const parentDir = dirname(basePath);

  if (parentDir === basePath) {
    return parentDir || fallback;
  }

  return findParent(parentDir, comparison, fallback);
}
