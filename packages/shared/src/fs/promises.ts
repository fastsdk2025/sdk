import {readFile, writeFile, mkdir} from "node:fs/promises"
import {dirname} from "node:path"
import { walk, walkFiles, walkDirectories } from "@/fs/walk.ts"
import { BufferLike } from "@/buffer/types.ts"
import { toBuffer } from "@/buffer"

export async function readText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8")
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${(error as Error).message}`, {
      cause: error
    })
  }
}

export async function readArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  try {
    const nodeBuffer = await readFile(filePath);

    return nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    ) as ArrayBuffer;
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${(error as Error).message}`, {
      cause: error
    })
  }
}

export async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true })
  } catch (error) {
    throw new Error(`ensureDir failed with error: ${dir}: ${(error as Error).message}`, {
      cause: error
    })
  }
}

export async function readJSON<T extends object>(
  filePath: string
): Promise<T> {
  try {
    const content = await readText(filePath)
    return JSON.parse(content) as T
  } catch (error) {
    throw new Error(`Could not read JSON file: ${filePath}: ${(error as Error).message}`, { cause: error });
  }
}

export async function writeText(filePath: string, content: string) {
  try {
    await ensureDir(dirname(filePath))
    await writeFile(filePath, content, "utf-8")
  } catch (error) {
    throw new Error(`Could not write ${filePath}: ${(error as Error).message}`, {
      cause: error
    })
  }
}

export async function writeArrayBuffer(filePath: string, buffer: BufferLike) {
  try {
    await ensureDir(dirname(filePath))
    const content = toBuffer(buffer);

    await writeFile(filePath, content);
  } catch (error) {
    throw new Error(`Could not write ${filePath}: ${(error as Error).message}`, {
      cause: error
    })
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
    throw new Error(`Could not write JSON file: ${filePath}: ${(error as Error).message}`, { cause: error });
  }
}

export {
  walk,
  walkFiles,
  walkDirectories
}
