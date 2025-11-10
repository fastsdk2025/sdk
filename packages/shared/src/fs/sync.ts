import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { walkSync, walkFilesSync, walkDirectoriesSync } from "@/fs/walk.ts"
import { tr } from "zod/v4/locales"
import { dirname } from "node:path"
import { BufferLike } from "@/buffer/types"
import { toBuffer } from "@/buffer"
import { unknown } from "zod"

export function ensureDirSync(dir: string) {
  try {
    mkdirSync(dir, { recursive: true })
  } catch(error) {
    throw new Error(`Failed to create directory ${dir}: ${(error as Error).message}`, { cause: error })
  }
}

export function readTextSync(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`, { cause: error })
  }
}

export function readArrayBufferSync(filePath: string): ArrayBuffer {
  try {
    const nodeBuffer = readFileSync(filePath);

    return nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    ) as ArrayBuffer;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`, { cause: error })
  }
}

export function readJSONSync<T extends object>(filePath: string): T {
  try {
    const content = readTextSync(filePath);
    return JSON.parse(content) as T
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${(error as Error).message}`, { cause: error })
  }
}

export function writeTextSync(filePath: string, content: string): void {
  try {
    ensureDirSync(dirname(filePath))
    writeFileSync(filePath, content, "utf-8")
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`, { cause: error })
  }
}

export function writeArrayBufferSync(filePath: string, buffer: BufferLike): void {
  try {
    ensureDirSync(dirname(filePath));

    const content = toBuffer(buffer);

    writeFileSync(filePath, content)
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`, { cause: error })
  }
}

export function writeJSONSync(filePath: string, content: unknown, pretty: boolean = true): void {
  try {
    ensureDirSync(dirname(filePath));

    const json = JSON.stringify(content, null, pretty ? 2 : 0);

    writeFileSync(filePath, json)
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${(error as Error).message}`, { cause: error })
  }
}

export {
  walkDirectoriesSync,
  walkFilesSync,
  walkSync
}
