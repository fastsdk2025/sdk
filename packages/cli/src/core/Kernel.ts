import { Command } from "commander";
import ServiceManager from "./ServiceManager";
import { CommandConstructor } from "./types";
import { serviceDefinitions } from "./services/registry";

export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;

  constructor() {
    super();

    this.serviceManager = new ServiceManager(this);
  }

  public async boot() {
    this.serviceManager.defineMultiple(serviceDefinitions);

    await this.serviceManager.initAll();
  }

  public registerCommand(commandClass: CommandConstructor) {
    const command = new commandClass(this);
    this.addCommand(command.program);
  }
}
