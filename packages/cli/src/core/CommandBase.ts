import { Command } from "commander";
import Kernel from "./Kernel";
import { ServiceInstance, ServiceName } from "./types";

export default abstract class CommandBase {
  public readonly program: Command = new Command();
  constructor(
    protected kernel: Kernel
  ) {
    this.onEnable()
  }

  protected getService<K extends ServiceName>(name: K): ServiceInstance<K> | undefined {
    return this.kernel.serviceManager.get(name)
  }

  protected requireService<K extends ServiceName>(name: K): ServiceInstance<K> {
    return this.kernel.serviceManager.require(name)
  }

  abstract onEnable(): void;

  public onDisable?(): void;
  public onError?(error: Error): void;
}
