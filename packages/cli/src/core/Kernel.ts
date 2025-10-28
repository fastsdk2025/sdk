import { Command } from "commander";
import ServiceManager from "./ServiceManager";
import LoggerService from "./services/logger/LoggerService";
import ConfigService from "./services/config/ConfigService";
import { CommandConstructor } from "./types";

export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;

  constructor() {
    super()

    this.serviceManager = new ServiceManager(this)
  }

  public async boot() {
    this.serviceManager.define("logger", LoggerService)
    this.serviceManager.define("config", ConfigService)

    await this.serviceManager.initAll()
  }

  public registerCommand(commandClass: CommandConstructor) {
    const command = new commandClass(this)
    this.addCommand(command.program)
  }
}
