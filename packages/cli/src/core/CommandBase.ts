import { Command } from "commander";
import Kernel from "./Kernel";

export default abstract class CommandBase {
  public readonly program: Command = new Command();
  constructor(
    private kernel: Kernel
  ) {
    this.onEnable()
  }

  abstract onEnable(): void;
}
