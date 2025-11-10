import {readFile, writeFile, mkdir, readdir, stat} from "node:fs/promises"
import {dirname, join, resolve, basename} from "node:path"
import type { Stats } from "node:fs"
import * as console from "node:console";
import {WalkEntry, WalkOptions} from "@/fs/types.ts";
import { walk, walkFiles, walkDirectories } from "@/fs/walk.ts"


export const DEFAULT_OPTIONS: Required<WalkOptions> = {
  recursive: true,
  maxDepth: Infinity,
  followSymlinks: true,
  filter: () => true,
  onError: (error) => console.error('Walk error: ', error),
  order: "pre"
}

export async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true })
  } catch (error) {
    throw new Error(`ensureDir failed with error: ${error}`)
  }
}

export async function readJSON<T extends object>(
  filePath: string
): Promise<T> {
  try {
    const content = await readFile(filePath, "utf-8")
    return JSON.parse(content) as T
  } catch (error) {
    throw new Error(`Could not read JSON file: ${filePath}`, { cause: error });
  }
}

export async function writeJSON(
  filePath: string,
  data: unknown,
  pretty: boolean = true
) {
  try {
    await ensureDir(dirname(filePath))
    await writeFile(filePath, JSON.stringify(data, null, pretty ? 2 : 0))
  } catch (error) {
    throw new Error(`Could not write JSON file: ${filePath}`, { cause: error });
  }
}

export {
  walk,
  walkFiles,
  walkDirectories
}
