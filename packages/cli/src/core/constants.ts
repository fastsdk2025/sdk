import { homedir } from "node:os";
import { join } from "node:path";

export const APP_NAME = "fast";
export const APP_DIR = join(homedir(), `.${APP_NAME}`)

export const CONFIG = {
  DIR: APP_DIR,
  FILE: join(APP_DIR, "config.json"),
  DEBOUNCE_DELAY: 100,
} as const

export const LOGGER = {
  DEFAULT_LEVEL: "info",
  DATE_FORMAT: "YYYY-MM-DD HH:mm:ss",
} as const
