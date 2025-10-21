import { ConfigPath, IConfig, PathValue } from "./types";

export class ConfigManager {
  private cache = new Map<string, unknown>();

  private data!: IConfig;

  constructor(initialConfig: Partial<IConfig> = {}) {
    this.data = this.mergeWithDefaultConfig(initialConfig);
  }

  private getDefaultConfig(): IConfig {
    return {
      cloud: {},
    };
  }

  private mergeWithDefaultConfig(config: Partial<IConfig>): IConfig {
    const defaults = this.getDefaultConfig();
    return this.deepMerge(defaults, config);
  }

  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(
          (target as any)[key] || {},
          source[key] as any,
        );
      } else {
        (result as any)[key] = source[key];
      }
    }

    return result;
  }

  public get<K extends keyof IConfig>(key: K): IConfig[K];
  public get<P extends ConfigPath>(path: P): PathValue<IConfig, P>;
  public get<P extends string>(path: P): PathValue<IConfig, P> | undefined;
  public get(path: string): unknown {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const value = path.split(".").reduce((obj, key) => {
      return obj?.[key];
    }, this.data as any);

    if (value !== undefined) {
      this.cache.set(path, value);
    }
    return value;
  }

  public set<K extends keyof IConfig>(key: K, value: IConfig[K]): void;
  public set<P extends ConfigPath>(path: P, value: PathValue<IConfig, P>): void;
  public set(path: string, value: unknown) {
    const keys = path.split(".");
    const lastKey = keys.pop()!;

    let current = this.data;
    for (const key of keys) {
      if (!(key in current)) {
        (current as any)[key] = {};
      }

      current = (current as any)[key];
    }

    (current as any)[lastKey] = value;

    this.clearCache(path);
  }

  private clearCache(path: string) {
    for (const cachedPath of this.cache.keys()) {
      if (cachedPath === path || cachedPath.startsWith(`${path}.`)) {
        this.cache.delete(cachedPath);
      }
    }
  }

  public has<P extends ConfigPath>(path: P): boolean {
    return this.cache.has(path);
  }

  public getAll(): Readonly<IConfig> {
    return {
      ...this.data,
    };
  }

  public reset(config: Partial<IConfig> = {}): void {
    this.data = this.mergeWithDefaultConfig(config);
    this.cache.clear();
  }
}
