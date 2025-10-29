import { IConfig } from "./types";
import Service from "@core/base/Service";
import { dirname } from "node:path";
import { ensureDir } from "@utils/ensureDir";
import { readJSON } from "@utils/readJSON";
import { writeJSON } from "@utils/writeJSON";
import LoggerService from "../logger/LoggerService";
import { CONFIG } from "@core/constants";

export default class ConfigService extends Service {
  private static readonly CONFIG_DIR: string = CONFIG.DIR;
  private static readonly CONFIG_FILE: string = CONFIG.FILE;
  private static readonly DEBOUNCE_DELAY = CONFIG.DEBOUNCE_DELAY;

  private data!: IConfig;
  private saveTimeout: NodeJS.Timeout | null = null;
  private logger!: LoggerService;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.loadConfig();
    process.on("exit", this.flush.bind(this));
  }

  public async onDestroy(): Promise<void> {
    this.flush();
  }

  public loadConfig(): void {
    ensureDir(dirname(ConfigService.CONFIG_FILE));
    try {
      this.data = readJSON<IConfig>(ConfigService.CONFIG_FILE);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.data = this.getDefaultConfig();
        this.requestSave();
      } else if (error instanceof SyntaxError) {
        this.logger.error("Config file corrupted, creating backup...");
        this.data = this.getDefaultConfig();
        this.requestSave();
      } else {
        throw new Error(`Failed to load config: ${error}`, { cause: error });
      }
    }
  }

  private getDefaultConfig(): IConfig {
    return {
      cloud: {},
    };
  }

  public save(): void {
    writeJSON(ConfigService.CONFIG_FILE, this.data);
  }

  private requestSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
      this.saveTimeout = null;
    }, ConfigService.DEBOUNCE_DELAY);
  }

  public flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.save();
  }

  public get<K extends keyof IConfig>(key: K): IConfig[K] {
    return this.data[key];
  }

  public set<K extends keyof IConfig>(key: K, value: IConfig[K]): void {
    this.data[key] = value;
    this.requestSave();
  }

  public delete<K extends keyof IConfig>(key: K): void {
    delete this.data[key];
    this.requestSave();
  }

  public has<K extends keyof IConfig>(key: K): boolean {
    return key in this.data;
  }
}
