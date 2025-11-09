import * as process from "node:process";
import {parseEnv} from "@/env";
import {z} from "zod";
import {isCommandAvailable} from "@/system/isCommandAvailable.ts";

export function getAvailableEditor(): string {
  const env = parseEnv(z.object({
    EDITOR: z.string()
  }))
  if (env.EDITOR) {
    return env.EDITOR;
  }

  const editors = process.platform === "win32" ? ["notepad"] : ["nvim", "vim", "vi", "nano"];

  for (const editor of editors) {
    if (isCommandAvailable(editor)) {
      return editor
    }
  }

  throw  new Error(`No text editor found. Please set the EDITOR environment variable.`)
}