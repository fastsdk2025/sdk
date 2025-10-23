import { Command } from "commander";
import ServiceManager from "./ServiceManager";
import LoggerService from "./services/logger/LoggerService";

export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;

  constructor() {
    super()

    this.serviceManager = new ServiceManager(this)
  }

  public boot() {
    this.serviceManager.register("logger", LoggerService)
  }
}
