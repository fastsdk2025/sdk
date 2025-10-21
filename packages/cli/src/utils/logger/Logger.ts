import chalk from "chalk";
import { LogLevelLiteral } from "./types";
import { formatDate } from "./formatter";
import { LogLevel } from "./levels";

export default class Logger {
  private constructor(
    private logLevel: LogLevelLiteral = "info",
    private context?: string,
  ) {}
  public static createLogger(
    logLevel: LogLevelLiteral = "info",
    context?: string,
  ): Logger {
    return new Logger(logLevel, context);
  }
  private _log(level: LogLevelLiteral, ...message: unknown[]) {
    if (level === "silent") return;
    if (LogLevel[level].priority < LogLevel[this.logLevel].priority) return;

    const line: unknown[] = [this.getDate(), LogLevel[level].level()];
    if (this.context) {
      line.push(chalk.gray(`[${this.context}]`));
    }
    if (typeof message[0] === "string") {
      line.push(LogLevel[level].color(message[0]));
      line.push(...message.slice(1));
    } else {
      line.push(...message);
    }
    console.log(...line);
  }

  private getDate() {
    return chalk.dim.gray(`[${formatDate(new Date())}]`);
  }

  public setLevel(level: LogLevelLiteral) {
    this.logLevel = level;
  }

  public info(...message: unknown[]) {
    this._log("info", ...message);
  }

  public debug(...message: unknown[]) {
    this._log("debug", ...message);
  }

  public warn(...message: unknown[]) {
    this._log("warn", ...message);
  }

  public error(...message: unknown[]) {
    this._log("error", ...message);
  }
}
