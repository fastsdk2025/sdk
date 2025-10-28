import { Command } from "commander";
import ServiceManager from "./ServiceManager";
import LoggerService from "./services/logger/LoggerService";
import CommandBase from "./CommandBase";
import ConfigService from "./services/config/ConfigService";

export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;

  constructor() {
    super()

    this.serviceManager = new ServiceManager(this)
  }

  public boot() {
    this.serviceManager.register("logger", LoggerService)
    this.serviceManager.register("config", ConfigService)
  }

  public registerCommand(commandClass: new (kernel: Kernel) => CommandBase) {
    const command = new commandClass(this)
    this.addCommand(command.program)
  }
}
