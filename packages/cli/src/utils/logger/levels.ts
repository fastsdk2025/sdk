import chalk from "chalk";

export const LogLevel = {
  debug: {
    level: () => chalk.bgBlue.whiteBright.bold(` DEBUG `),
    priority: 40,
    color: (text: string) => chalk.blue(text),
  },
  info: {
    level: () => chalk.bgGreen.whiteBright.bold(` INFO `),
    priority: 30,
    color: (text: string) => chalk.green(text),
  },
  warn: {
    level: () => chalk.bgYellow.whiteBright.bold(` WARN `),
    priority: 20,
    color: (text: string) => chalk.yellow(text),
  },
  error: {
    level: () => chalk.bgRed.whiteBright.bold(` ERROR `),
    priority: 10,
    color: (text: string) => chalk.red(text),
  },
  silent: {
    level: () => "",
    priority: -1,
    color: (text: string) => text,
  },
} as const;
