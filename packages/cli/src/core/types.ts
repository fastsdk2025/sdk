import Kernel from "./Kernel";
import Service from "./Service";

export interface ServiceContext {
  kernel: Kernel;
  getService<T extends Service>(name: string): T | undefined;
  requireService<T extends Service>(name: string): T;
}

export interface ServiceConstructor<T extends Service = Service> {
  new(context: ServiceContext): T;
  dependencies?: string[];
}
