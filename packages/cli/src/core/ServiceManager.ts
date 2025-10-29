import Kernel from "./Kernel";
import { ServiceName, ServiceConstructor } from "./services/registry";
import { ServiceInstance, ServiceContext } from "./types";

export default class ServiceManager {
  private readonly services: Map<ServiceName, ServiceInstance> = new Map();
  private readonly definitions: Map<ServiceName, ServiceConstructor> =
    new Map();
  private readonly instantiating: Set<ServiceName> = new Set();
  private initialized: boolean = false;

  constructor(protected kernel: Kernel) {}

  public define<K extends ServiceName, T extends ServiceConstructor>(
    name: K,
    ctor: T,
  ): void {
    if (this.initialized) {
      throw new Error(`Cannot define service "${name}" after initialization.`);
    }
    this.definitions.set(name, ctor);
  }

  public defineMultiple<K extends ServiceName, T extends ServiceConstructor>(
    services: Record<K, T>,
  ): void {
    for (const [name, ctor] of Object.entries(services) as Array<[K, T]>) {
      this.define(name, ctor);
    }
  }

  public get<K extends ServiceName, T extends ServiceInstance>(
    name: K,
  ): T | undefined {
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    const definition = this.definitions.get(name);
    if (!definition) {
      return undefined;
    }

    return this.instantiate<K, T>(name, definition as ServiceConstructor);
  }

  public require<K extends ServiceName, T extends ServiceInstance>(name: K): T {
    const service = this.get<K, T>(name);
    if (!service) {
      throw new Error(`Service "${name}" not found or not registered`);
    }
    return service as T;
  }

  public instantiate<K extends ServiceName, T extends ServiceInstance>(
    name: K,
    Ctor: ServiceConstructor,
  ): T {
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    if (this.instantiating.has(name)) {
      throw new Error(
        `Circular dependency detected when instantiating service "${name}"`,
      );
    }
    this.instantiating.add(name);

    try {
      const context = this.createContext();

      const instance = new Ctor(context);
      this.services.set(name, instance);

      instance.onRegister?.();

      return instance as T;
    } catch (error) {
      this.instantiating.delete(name);
      this.services.delete(name);
      throw new Error(
        `Failed to instantiate service "${name}": ${(error as Error).message}`,
        {
          cause: error,
        },
      );
    }
  }

  private createContext(): ServiceContext {
    const that = this;
    return {
      kernel: this.kernel,
      getService<K extends ServiceName, T extends ServiceInstance>(
        name: K,
      ): T | undefined {
        return that.get(name);
      },
      requireService<K extends ServiceName, T extends ServiceInstance>(
        name: K,
      ): T {
        return that.require(name);
      },
    };
  }

  public async initAll() {
    if (this.initialized) {
      throw new Error("Services have already been initialized");
    }

    for (const name of this.definitions.keys()) {
      this.get(name);
    }

    const initPromises: Promise<void>[] = [];
    for (const [name, service] of this.services.entries()) {
      if (service.onInit) {
        initPromises.push(
          service.onInit().catch((error) => {
            throw new Error(
              `Failed to initialize service "${name}": ${(error as Error).message}`,
              {
                cause: error,
              },
            );
          }),
        );
      }
    }
    await Promise.all(initPromises);
    this.initialized = true;
  }

  public async destroy<K extends ServiceName>(name: K) {
    const instance = this.services.get(name);
    if (instance) {
      try {
        await instance.onDestroy?.();
      } catch (error) {
        throw new Error(
          `Failed to destroy service "${name}": ${(error as Error).message}`,
          {
            cause: error,
          },
        );
      } finally {
        this.services.delete(name);
      }
    }
  }

  public async destroyAll() {
    const that = this;
    const destroyPromises: Promise<void>[] = [];
    for (const [name, service] of this.services.entries()) {
      if (service.onDestroy) {
        destroyPromises.push(
          service.onDestroy().catch((error) => {
            console.error(`Error destroying service "${name}": `, error);
          }),
        );
      }
    }

    await Promise.all(destroyPromises);
    this.services.clear();
    this.initialized = false;
  }

  public has<K extends ServiceName>(name: K) {
    return this.services.has(name) || this.definitions.get(name);
  }

  public getNames(): string[] {
    return Array.from(
      new Set([...this.services.keys(), ...this.definitions.keys()]),
    );
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}
