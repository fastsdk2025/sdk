import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { readJSON } from "../readJSON";
import { IConfig } from "./types";
import { ensureDir } from "../ensureDir";
import { writeJSON } from "../writeJSON";

export class ConfigManager {
  private static readonly CONFIG_DIR = join(homedir(), ".fast")
  private static readonly CONFIG_FILE = join(this.CONFIG_DIR, "config.json")
  private static readonly DEBOUNCE_DELAY = 100

  public static instance: ConfigManager;
  private data!: IConfig;
  private saveTimeout: NodeJS.Timeout | null = null

  private constructor() {
    this.loadConfig();

    process.on("beforeExit", this.flush.bind(this))
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  public loadConfig() {
    ensureDir(dirname(ConfigManager.CONFIG_FILE))
    try {
      this.data = readJSON<IConfig>(ConfigManager.CONFIG_FILE)
    } catch {
      this.data = {
        cloud: {}
      } as IConfig
      this.save()
    }
  }

  public save() {
    writeJSON(ConfigManager.CONFIG_FILE, this.data)
  }

  private requestSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.save()
      this.saveTimeout = null
    }, ConfigManager.DEBOUNCE_DELAY);
  }

  public flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.save()
  }

  public get<K extends keyof IConfig>(key: K): IConfig[K] {
    return this.data[key]
  }

  public set<K extends keyof IConfig>(key: K, value: IConfig[K]): void {
    this.data[key] = value;
    this.requestSave()
  }

  public delete<K extends keyof IConfig>(key: K): void {
    delete this.data[key]
    this.requestSave()
  }

  public has<K extends keyof IConfig>(key: K): boolean {
    return key in this.data
  }
}
