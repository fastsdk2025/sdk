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

  public async boot() {
    this.serviceManager.defineMultiple({
      logger: LoggerService,
      config: ConfigService
    })

    await this.serviceManager.initAll()
  }

  public registerCommand(commandClass: new (kernel: Kernel) => CommandBase) {
    const command = new commandClass(this)
    this.addCommand(command.program)
  }
}
