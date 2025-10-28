import Kernel from "./Kernel";
import { ServiceName, ServiceConstructor } from "./services/registry"
import { ServiceInstance, ServiceContext } from "./types";

export default class ServiceManager {
  private readonly services: Map<ServiceName, ServiceInstance> = new Map();
  private readonly definitions: Map<ServiceName, ServiceConstructor> = new Map()
  private initialized: boolean = false;

  constructor(protected kernel: Kernel) { }

  public define<K extends ServiceName, T extends ServiceConstructor>(name: K, ctor: T): void {
    this.definitions.set(name, ctor)
  }

  public defineMultiple<K extends ServiceName, T extends ServiceConstructor>(services: Record<K, T>) {
    for (const [name, ctor] of Object.entries(services) as Array<[K, T]>) {
      this.define(name, ctor)
    }
  }

  public get<K extends ServiceName, T extends ServiceInstance>(name: K): T | undefined {
    if (this.services.has(name)) {
      return this.services.get(name) as T
    }

    const definition = this.definitions.get(name)
    if (definition) {
      return this.instantiate<K, T>(name, definition as ServiceConstructor)
    }

    return undefined
  }

  public require<K extends ServiceName, T extends ServiceInstance>(name: K): T {
    const service = this.get<K, T>(name)
    if (!service) {
      throw new Error(`Service "${name}" not found or not registered`)
    }
    return service as T
  }

  public instantiate<K extends ServiceName, T extends ServiceInstance>(name: K, Ctor: ServiceConstructor): T {
    if (this.services.has(name)) {
      return this.services.get(name) as T
    }

    const context = this.createContext()

    const placeholder = {} as T;
    this.services.set(name, placeholder);

    try {
      const instance = new Ctor(context)
      this.services.set(name, instance)

      instance.onRegister?.();

      if (this.initialized) {
        instance.onInit?.()
      }

      return instance as T
    } catch (error) {
      this.services.delete(name)
      throw error
    }
  }

  private createContext(): ServiceContext {
    const that = this;
    return {
      kernel: this.kernel,
      getService<K extends ServiceName, T extends ServiceInstance>(name: K): T | undefined {
        return that.get(name)
      },
      requireService<K extends ServiceName, T extends ServiceInstance>(name: K): T {
        return that.require(name)
      }
    }
  }

  public async initAll() {
    for (const name of this.definitions.keys()) {
      this.get(name)
    }

    for (const service of this.services.values()) {
      await service.onInit?.()
    }

    this.initialized = true
  }

  public destroy<K extends ServiceName>(name: K) {
    const instance = this.services.get(name)
    if (instance) {
      instance.onDestroy?.()
      this.services.delete(name)
    }
  }

  public async destroyAll() {
    for (const service of this.services.values()) {
      await service.onDestroy?.();
    }

    this.services.clear()
  }

  public has<K extends ServiceName>(name: K) {
    return this.services.has(name) || this.definitions.get(name)
  }

  public getNames(): string[] {
    return Array.from(new Set([
      ...this.services.keys(),
      ...this.definitions.keys()
    ]))
  }
}
