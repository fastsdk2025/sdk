import CommandBase from "./base/CommandBase";
import Kernel from "./Kernel";
import { ServiceName, ServiceRegistry } from "./services/registry";

export type ServiceInstance<K extends ServiceName = ServiceName> = ServiceRegistry[K];

export interface ServiceContext {
  kernel: Kernel;
  getService<K extends ServiceName, T extends ServiceInstance<K>>(name: K): T | undefined;
  requireService<K extends ServiceName, T extends ServiceInstance<K>>(name: K): T;
}

export interface CommandConstructor {
  new(kernel: Kernel): CommandBase;
}
