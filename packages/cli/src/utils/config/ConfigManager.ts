import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { readJSON } from "../readJSON";
import { IConfig } from "./types";
import { ensureDir } from "../ensureDir";
import { writeJSON } from "../writeJSON";
import { runInContext } from "node:vm";

export class ConfigManager {
  private static readonly CONFIG_DIR = join(homedir(), ".fast")
  private static readonly CONFIG_FILE = join(this.CONFIG_DIR, "config.json")

  public static instance: ConfigManager;
  private data!: IConfig;
  private isDirty = false;

  private constructor() {
    this.loadConfig();
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

  public get<K extends keyof IConfig>(key: K): IConfig[K] {
    return this.data[key]
  }

  public set<K extends keyof IConfig>(key: K, value: IConfig[K]): void {
    this.data[key] = value;
    this.save()
  }

  public delete<K extends keyof IConfig>(key: K): void {
    delete this.data[key]
    this.save()
  }

  public has<K extends keyof IConfig>(key: K): boolean {
    return key in this.data
  }
}
