import chalk from "chalk"
import { formatDate } from "./utils/formatDate"

const LogLevel = {
  silent: {
    priority: 0,
    levelColor: (text: string) => text,
    color: (text: string) => text,
  },
  info: {
    priority: 10,
    levelColor: chalk.bgGreen.whiteBright.bold,
    color: chalk.green.bold,
  },
  debug: {
    priority: 20,
    levelColor: chalk.bgBlue.whiteBright.bold,
    color: chalk.blue.bold,
  },
  warn: {
    priority: 30,
    levelColor: chalk.bgYellow.whiteBright.bold,
    color: chalk.yellow.bold,
  },
  error: {
    priority: 40,
    levelColor: chalk.bgRed.whiteBright.bold,
    color: chalk.red.bold,
  },
} as const
type LogLevelLiteral = keyof typeof LogLevel;
type LogLevelPriority = typeof LogLevel[LogLevelLiteral];

class Logger {
  private constructor() { }
  public static create() {
    return new Logger();
  }

  private _log(level: LogLevelLiteral, ...args: unknown[]) {
    console.log(
      this.getDateFormat(),
      this.getLevelFormat(level),
      ...this.getMessageFormat(level, ...args)
    );
  }

  private getDateFormat() {
    return chalk.dim.gray(`[${formatDate(new Date())}]`)
  }

  private getLevelFormat(level: LogLevelLiteral) {
    return LogLevel[level].levelColor(` ${level.toUpperCase()} `)
  }

  private getMessageFormat(level: LogLevelLiteral, ...args: unknown[]) {
    const message = []
    if (typeof args[0] === "string") {
      message.push(LogLevel[level].color(args[0]))
    } else {
      message.push(args[0])
    }

    message.push(...args.slice(1))

    return message
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

export const logger = Logger.create();
export const createLogger = Logger.create;