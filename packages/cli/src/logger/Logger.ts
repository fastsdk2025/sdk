import chalk from "chalk"
import { formatDate } from "./utils/formatDate"

const LogLevel = {
  silent: {
    priority: -1,
    levelColor: (text: string) => text,
    color: (text: string) => text,
  },
  error: {
    priority: 10,
    levelColor: chalk.bgRed.whiteBright.bold,
    color: chalk.red.bold,
  },
  warn: {
    priority: 20,
    levelColor: chalk.bgYellow.whiteBright.bold,
    color: chalk.yellow.bold,
  },
  info: {
    priority: 30,
    levelColor: chalk.bgGreen.whiteBright.bold,
    color: chalk.green.bold,
  },
  debug: {
    priority: 40,
    levelColor: chalk.bgBlue.whiteBright.bold,
    color: chalk.blue.bold,
  },
} as const
type LogLevelLiteral = keyof typeof LogLevel;

class Logger {

  private constructor(
    private logLevel: LogLevelLiteral = 'info',
    private readonly context?: string
  ) {}
  public static create(logLevel: LogLevelLiteral = "info", context?: string) {
    return new Logger(logLevel, context);
  }

  private _log(level: LogLevelLiteral, ...args: unknown[]) {
    if (this.logLevel === "silent") return
    if (LogLevel[level].priority > LogLevel[this.logLevel].priority)  return

    const line = [];
    line.push(this.getDateFormat());
    line.push(this.getLevelFormat(level))
    if (this.context) {
      line.push(this.getContextFormat())
    }
    line.push(...this.getMessageFormat(level, ...args))
    console.log(...line);
  }

  private getDateFormat() {
    return chalk.dim.gray(`[${formatDate(new Date())}]`)
  }

  private getLevelFormat(level: LogLevelLiteral) {
    return LogLevel[level].levelColor(` ${level.toUpperCase()} `)
  }

  private getContextFormat() {
    return chalk.gray(`[${this.context}]`)
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

  public setLevel(level: LogLevelLiteral) {
    this.logLevel = level
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