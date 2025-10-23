import { Command } from "commander";
import ServiceManager from "./ServiceManager";

export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;

  constructor() {
    super()

    this.serviceManager = new ServiceManager(this)
  }
}
