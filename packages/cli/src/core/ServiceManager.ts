import Kernel from "./Kernel";
import Service from "./Service";

export default class ServiceManager {
  private readonly services: Map<string, Service> = new Map()

  constructor(private kernel: Kernel) {}

  public register(name: string, serviceClass: new (kernel: Kernel) => Service) {
    if (this.services.has(name)) {
      return
    }

    const serviceInstance = new serviceClass(this.kernel)
    this.services.set(name, serviceInstance)
    serviceInstance.onRegister?.()
  }

  public get(name: string) {
    return this.services.get(name)
  }

  public destroy(name: string) {
    const instance = this.services.get(name)
    if (instance) {
      this.services.delete(name)
      instance.onDestroy?.()
    }
  }

  public destroyAll() {
    for (const [name] of this.services) {
      this.destroy(name)
    }
  }
}
