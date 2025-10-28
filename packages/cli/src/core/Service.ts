import { ServiceContext, ServiceInstance, ServiceName } from "./types";

export default abstract class Service {
  constructor(protected context: ServiceContext) { }

  protected getService<K extends ServiceName, T extends ServiceInstance<K>>(name: K): T | undefined {
    return this.context.getService<K, T>(name)
  }
  protected requireService<K extends ServiceName, T extends ServiceInstance<K>>(name: K): T {
    return this.context.requireService<K, T>(name)
  }

  public onRegister?(): void;
  public async onInit?(): Promise<void>;
  public async onDestroy?(): Promise<void>;
}
