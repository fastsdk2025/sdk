import { readdirSync } from "node:fs";
import { join } from "node:path";

interface WalkOptions {
  dirFilter?: (dir: string, name: string) => boolean;
  fileFilter?: (file: string) => boolean;
}

export function walkFile(dir: string, options?: WalkOptions): string[];
export function walkFile(
  dir: string,
  callback: (path: string) => void,
  options?: WalkOptions,
): void;

export function walkFile(
  dir: string,
  callbackOrOptions?: ((path: string) => void) | WalkOptions,
  optionsOrUndefined?: WalkOptions,
) {
  const isCallbackProvided = typeof callbackOrOptions === "function";
  const callback = isCallbackProvided ? callbackOrOptions : undefined;
  const options: WalkOptions =
    (isCallbackProvided ? optionsOrUndefined : callbackOrOptions) || {};

  let result: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (options.dirFilter && !options.dirFilter(fullPath, entry.name))
          continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        if (!options.fileFilter || options.fileFilter(fullPath)) {
          if (callback) {
            callback(fullPath);
          } else {
            result.push(fullPath);
          }
        }
      }
    }
  }

  walk(dir);

  if (!callback) {
    return result;
  }
}
