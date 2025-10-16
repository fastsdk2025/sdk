import { readFile } from "node:fs/promises"

export async function readJSON<T extends object>(filePath: string): Promise<T> {
  try {
    const content = await readFile(filePath, "utf-8")
    return JSON.parse(content) as T
  } catch (err) {
    throw new Error(`Failed to read ${filePath}: ${err}`)
  }
}