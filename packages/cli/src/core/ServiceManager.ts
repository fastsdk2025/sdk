import Kernel from "./Kernel";
import Service from "./Service";
import { ServiceConstructor, ServiceContext } from "./types";

export default class ServiceManager {
  private readonly services: Map<string, Service> = new Map();
  private readonly definitions: Map<string, ServiceConstructor> = new Map();
  private initialized: boolean = false;

  constructor(private kernel: Kernel) {}

  public define(name: string, serviceClass: ServiceConstructor): void {
    this.definitions.set(name, serviceClass)
  }

  public defineMultiple(services: Record<string, ServiceConstructor>): void {
    for (const [name, serviceClass] of Object.entries(services)) {
      this.define(name, serviceClass)
    }
  }

  public get<T extends Service>(name: string): T | undefined {
    if (this.services.has(name)) {
      return this.services.get(name) as T
    }

    const definition = this.definitions.get(name)
    if (definition) {
      return this.instantiate<T>(name, definition)
    }

    return undefined
  }

  public require<T extends Service>(name: string) {
    const service = this.get<T>(name)

    if (!service) {
      throw new Error(`Service "${name}" not found or not registered`)
    }

    return service
  }

  private instantiate<T extends Service>(name: string, serviceClass: ServiceConstructor): T {
    if (this.services.has(name)) {
      return this.services.get(name) as T
    }

    const context: ServiceContext = {
      kernel: this.kernel,
      getService: (name: string) => this.get(name),
      requireService: (name: string) => this.require(name)
    }

    const placeholder = {} as T
    this.services.set(name, placeholder);

    try {
      const instance = new serviceClass(context)
      this.services.set(name, instance)

      instance.onRegister?.();

      if (this.initialized) {
        instance.onInit?.();
      }

      return instance as T
    } catch (error) {
      this.services.delete(name)
      throw error
    }
  }

  public async initAll(): Promise<void> {
    for (const name of this.definitions.keys()) {
      this.get(name)
    }

    for (const service of this.services.values()) {
      await service.onInit?.();
    }

    this.initialized = true;
  }

  public destroy(name: string): void {
    const instance = this.services.get(name)
    if (instance) {
      instance.onDestroy?.()
      this.services.delete(name)
    }
  }

  public async destroyAll(): Promise<void> {
    for (const service of this.services.values()) {
      await service.onDestroy?.();
    }

    this.services.clear()
  }

  public has(name: string): boolean {
    return this.services.has(name) || this.definitions.has(name)
  }

  public getNames(): string[] {
    return Array.from(new Set([
      ...this.services.keys(),
      ...this.definitions.keys()
    ]))
  }
}
