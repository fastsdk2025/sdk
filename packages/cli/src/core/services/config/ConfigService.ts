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
  private exitHandler!: () => void;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.loadConfig();
    this.exitHandler = this.flush.bind(this);
    process.on("exit", this.exitHandler);
  }

  public async onDestroy(): Promise<void> {
    process.off("exit", this.exitHandler);
    this.flush();
  }

  public loadConfig(): void {
    try {
      ensureDir(dirname(ConfigService.CONFIG_FILE));
    } catch (error) {
      throw new Error(
        `Failed to create config directory: ${(error as Error).message}`,
        {
          cause: error,
        },
      );
    }

    try {
      this.data = readJSON<IConfig>(ConfigService.CONFIG_FILE);
      this.logger.debug(`Config loaded from ${ConfigService.CONFIG_FILE}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.logger.debug("Config file not found, creating default config");
        this.data = this.getDefaultConfig();
        this.requestSave();
      } else if (error instanceof SyntaxError) {
        this.logger.warn("Config file corrupted, using default config");
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
    try {
      writeJSON(ConfigService.CONFIG_FILE, this.data);
      this.logger.debug(`Config saved to ${ConfigService.CONFIG_FILE}`);
    } catch (error) {
      this.logger.error(`Failed to save config: ${(error as Error).message}`);
      throw error;
    }
  }

  private requestSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      try {
        this.save();
      } catch (error) {
        this.logger.error(`Auto-save failed: `, error);
      }
      this.saveTimeout = null;
    }, ConfigService.DEBOUNCE_DELAY);
  }

  public flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    try {
      this.save();
    } catch (error) {
      console.error("Failed to flush config: ", error);
    }
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

  public getAll(): Readonly<IConfig> {
    return { ...this.data };
  }

  public reset(): void {
    this.data = this.getDefaultConfig();
    this.requestSave();
  }
}
