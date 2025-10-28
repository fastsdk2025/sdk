import Kernel from "./Kernel";
import ConfigService from "./services/config/ConfigService";
import LoggerService from "./services/logger/LoggerService";

export interface ServiceRegistry {
  logger: LoggerService;
  config: ConfigService;
}

export type ServiceName = keyof ServiceRegistry;
export type ServiceInstance<K extends ServiceName = ServiceName> = ServiceRegistry[K];

export interface ServiceContext {
  kernel: Kernel;
  getService<K extends ServiceName, T extends ServiceInstance<K>>(name: K): T | undefined;
  requireService<K extends ServiceName, T extends ServiceInstance<K>>(name: K): T;
}

export interface ServiceConstructor<K extends ServiceName> {
  new(context: ServiceContext): ServiceRegistry[K];
  dependencies?: string[];
}
