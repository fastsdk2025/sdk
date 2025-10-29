import Service from "@core/base/Service";
import { LogLevelLiteral } from "./types";
import { LogLevel } from "./levels";
import chalk from "chalk";
import { formatDate } from "@/utils/formatDate";
import { LOGGER } from "@/core/constants";

export default class LoggerService extends Service {
  private logLevel: LogLevelLiteral = LOGGER.DEFAULT_LEVEL;
  private output: typeof console.log = console.log;

  private _log(level: LogLevelLiteral, ...args: unknown[]) {
    if (level === "silent") return;
    if (LogLevel[level].priority < LogLevel[this.logLevel].priority) return;

    const line: unknown[] = [this.getDate(), LogLevel[level].level()];

    if (typeof args[0] === "string") {
      line.push(LogLevel[level].color(args[0]));
      line.push(...args.slice(1));
    } else {
      line.push(...args);
    }

    this.output(...line);
  }

  private getDate() {
    return chalk.dim.gray(`[${formatDate(new Date(), LOGGER.DATE_FORMAT)}]`);
  }

  public setLevel(logLevel: LogLevelLiteral) {
    if (!LogLevel[logLevel]) {
      throw new Error(`Invalid log level: ${logLevel}`);
    }
    this.logLevel = logLevel;
  }

  public setOutput(output: typeof console.log): void {
    this.output = output;
  }

  public info(...args: unknown[]) {
    this._log("info", ...args);
  }

  public debug(...args: unknown[]) {
    this._log("debug", ...args);
  }

  public warn(...args: unknown[]) {
    this._log("warn", ...args);
  }

  public error(...args: unknown[]) {
    this._log("error", ...args);
  }
}
