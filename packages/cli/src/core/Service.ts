import { ServiceContext } from "./types";

export default abstract class Service {
  constructor(protected context: ServiceContext) { }

  protected getService<T extends Service>(name: string): T | undefined {
    return this.context.getService<T>(name)
  }
  protected requireService<T extends Service>(name: string): T {
    return this.context.requireService<T>(name)
  }

  public onRegister?(): void;
  public async onInit?(): Promise<void>;
  public async onDestroy?(): Promise<void>;
}
