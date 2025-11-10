import { basename, join, resolve } from "node:path";
import { WalkEntry, WalkOptions } from "./types";
import { readdirSync, Stats, statSync } from "node:fs";
import { readdir, stat } from "node:fs/promises"

export const DEFAULT_OPTIONS: Required<WalkOptions> = {
  recursive: true,
  maxDepth: Infinity,
  followSymlinks: true,
  filter: () => true,
  onError: (error) => console.error("Walk error: ", error),
  order: "pre"
}

export function* walkSync(
  base: string,
  options: WalkOptions = {}
): Generator<WalkEntry, void, unknown> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const root = resolve(base);

  function* walkRecursive(
    currentPath: string,
    currentDepth: number,
  ): Generator<WalkEntry, void, unknown> {
    if (opts.maxDepth) {
      if (currentDepth > opts.maxDepth) {
        return
      }
    }

    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        const isSymlink = entry.isSymbolicLink();

        if (isSymlink && !opts.followSymlinks) continue;

        let stats: Stats | undefined;
        let isFile = entry.isFile();
        let isDirectory = entry.isDirectory();

        if (isSymlink && opts.followSymlinks) {
          try {
            stats = statSync(fullPath);
            isFile = stats.isFile();
            isDirectory = stats.isDirectory();
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
          yield walkEntry;
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
    const rootStats = statSync(root);
    if (!rootStats.isDirectory()) {
      throw new Error(`Path "${root}" is not a directory`);
    }
  } catch (error) {
    throw new Error(`Invalid root path: ${(error as Error).message}`, { cause: error });
  }

  yield* walkRecursive(root, 0)
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

export function walkFilesSync(
  base: string,
  options: Omit<WalkOptions, "filter"> = {}
): string[] {
  const files: string[] = [];

  for (const entry of walkSync(base, {
    ...options,
    filter: e => e.isFile
  })) {
    files.push(entry.path)
  }

  return files;
}

export function walkDirectoriesSync(
  base: string,
  options: Omit<WalkOptions, "filter"> = {}
): string[] {
  const files: string[] = [];

  for (const entry of walkSync(base, {
    ...options,
    filter: e => e.isDirectory
  })) {
    files.push(entry.path)
  }

  return files;
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
