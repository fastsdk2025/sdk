import {readFile, writeFile, mkdir, readdir, stat} from "node:fs/promises"
import {dirname, join, resolve, basename} from "node:path"
import type { Stats } from "node:fs"
import * as console from "node:console";
import {WalkEntry, WalkOptions} from "@/fs/types.ts";


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

export async function* walk(
  base: string,
  options: WalkOptions = {}
): AsyncGenerator<WalkEntry, void, unknown> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const root = resolve(base)

  async function* walkRecursive(
    currentPath: string,
    currentDepth: number,
  ): AsyncGenerator<WalkEntry, void, unknown> {
    if (currentDepth > opts.maxDepth) {
      return
    }

    try {
      const entries = await readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        const isSymlink = entry.isSymbolicLink();

        if (isSymlink && !opts.followSymlinks) continue;

        let stats: Stats | undefined;
        let isFile = entry.isFile();
        let isDirectory = entry.isDirectory();

        if (isSymlink && opts.followSymlinks) {
          try {
            stats = await stat(fullPath)
            isFile = stats.isFile()
            isDirectory = stats.isDirectory()
          } catch (error) {
            opts.onError?.(error as Error, {
              path: fullPath,
              name: entry.name,
              isFile,
              isDirectory,
              isSymbolicLink: true,
              depth: currentDepth,
              stats
            })
            continue;
          }
        }

        const walkEntry: WalkEntry = {
          path: fullPath,
          name: entry.name,
          isFile,
          isDirectory,
          isSymbolicLink: isSymlink,
          depth: currentDepth,
          stats
        }

        if (!opts.filter(walkEntry)) {
          continue
        }

        if (opts.order === "pre") {
          yield walkEntry
        }

        if (isDirectory && opts.recursive) {
          yield* walkRecursive(fullPath, currentDepth + 1)
        }

        if (opts.order === "post") {
          yield walkEntry
        }
      }
    } catch (error) {
      opts.onError?.(error as Error, {
        path: currentPath,
        name: basename(currentPath),
        isFile: false,
        isDirectory: true,
        isSymbolicLink: false,
        depth: currentDepth - 1
      })
    }
  }

  try {
    const rootStats = await stat(root);
    if (!rootStats.isDirectory()) {
      throw new Error(`Path "${root}" is not a directory.`);
    }
  } catch (error) {
    throw new Error(`Invalid root path: ${error}`);
  }

  yield* walkRecursive(root, 0)
}


export async function walkFiles(
  base: string,
  options: Omit<WalkOptions, "filter"> = {}
): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of walk(base, {
    ...options,
    filter: e => e.isFile
  })) {
    files.push(entry.path);
  }

  return files;
}

export async function walkDirectories(
  base: string,
  options: Omit<WalkOptions, "filter"> = {}
): Promise<string[]> {
  const directories: string[] = [];

  for await (const entry of walk(base, {
    ...options,
    filter: e => e.isDirectory
  })) {
    directories.push(entry.path);
  }

  return directories;
}