import { IConfig } from "@utils/config/types";
import Service from "@core/Service";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import Kernel from "@core/Kernel";
import { ensureDir } from "@utils/ensureDir";
import { readJSON } from "@utils/readJSON";
import { writeJSON } from "@utils/writeJSON";

export default class ConfigService extends Service {
  private static readonly CONFIG_DIR: string = join(homedir(), ".fast")
  private static readonly CONFIG_FILE: string = join(ConfigService.CONFIG_DIR, "config.json")
  private static readonly DEBOUNCE_DELAY = 100;

  private data!: IConfig;
  private saveTimeout: NodeJS.Timeout | null = null

  public onRegister(): void {
    this.loadConfig()
    process.on("exit", this.flush.bind(this))
  }

  public onDestroy(): void {
    this.flush()
  }

  public loadConfig(): void {
    ensureDir(dirname(ConfigService.CONFIG_FILE))
    try {
      this.data = readJSON<IConfig>(ConfigService.CONFIG_FILE)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.data = this.getDefaultConfig()
        this.requestSave()
      } else if (error instanceof SyntaxError) {
        console.error("Config file corrupted, creating backup...")
        this.data = this.getDefaultConfig()
        this.requestSave()
      } else {
        throw new Error(`Failed to load config: ${error}`, { cause: error })
      }
    }
  }

  private getDefaultConfig(): IConfig {
    return {
      cloud: {}
    }
  }

  public save(): void {
    writeJSON(ConfigService.CONFIG_FILE, this.data)
  }

  private requestSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
      this.saveTimeout = null
    }, ConfigService.DEBOUNCE_DELAY);
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
    return key in this.data;
  }
}
