import { Command } from "commander";
import ServiceManager from "./ServiceManager";
import { CommandConstructor } from "./types";
import { serviceDefinitions } from "./services/registry";

export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;
  private booted: boolean = false;

  constructor() {
    super();
    this.serviceManager = new ServiceManager(this);
  }

  public async boot() {
    if (this.booted) {
      throw new Error("Kernel has already been booted");
    }
    try {
      this.serviceManager.defineMultiple(serviceDefinitions);
      await this.serviceManager.initAll();
      this.booted = true;
    } catch (error) {
      throw new Error(`Failed to boot kernel: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  public registerCommand(commandClass: CommandConstructor) {
    if (!this.booted) {
      throw new Error("Cannot register commands before kernel is booted");
    }

    const command = new commandClass(this);
    this.addCommand(command.program);
  }

  public async shutdown() {
    if (!this.booted) {
      return;
    }

    try {
      await this.serviceManager.destroyAll();
      this.booted = false;
    } catch (error) {
      throw new Error(
        `Failed to shutdown kernel: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }

  public isBooted(): boolean {
    return this.booted;
  }
}
