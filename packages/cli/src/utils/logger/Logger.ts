import chalk from "chalk";
import { LogLevelLiteral } from "./types";
import { formatDate } from "./formatter";
import { LogLevel } from "./levels";

export default class Logger {
  private _log(level: LogLevelLiteral, ...message: unknown[]) {
    const line: unknown[] = [this.getDate(), LogLevel[level].level()];
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
