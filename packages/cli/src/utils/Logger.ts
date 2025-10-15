import chalk from "chalk"

const LevelPalette = {
	debug: {
		level: chalk.bgHex("#003eb3").whiteBright.bold(" DEBUG "),
		fg: chalk.blue.bold
	},
	info: {
		level: chalk.bgHex("#237804").whiteBright.bold(" INFO "),
		fg: chalk.green.bold
	},
	warn: {
		level: chalk.bgHex("#ad4e00").whiteBright.bold(" WARN "),
		fg: chalk.yellow.bold
	},
	error: {
		level: chalk.bgHex("#f5222d").whiteBright.bold(" ERROR "),
		fg: chalk.red.bold
	}
}

const LevelColor = {
	trace: chalk.hex("#8A8A8A"),
	debug: chalk.hex("#00D7D7"),
	info: chalk.hex("#5FFF00"),
	warn: chalk.hex("#FFAF00").bold,
	error: chalk.hex("#FF0000").bold,
	fatal: chalk.bgHex("#D70000").whiteBright.bold
}

const LogLevel = {
	silent: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4
}

type LevelType = "debug" | "info" | "warn" | "error"

class Logger {
	private _log(level: LevelType, ...message: unknown[]) {
		console.log(this.getDateTime(), LevelPalette[level].level, ...(message.map(t => typeof t === "string" ? LevelPalette[level].fg(t) : t)))
	}

	private getDateTime() {
		const now = new Date()
		const locale = "zh-CN"
		const date = now.toLocaleDateString(locale).replace(/\//g, "-")
		const time = new Date().toLocaleTimeString("zh-CN", { hour12: false })
		return chalk.gray(`[${date} ${time}]`)
	}

	public debug(...message: unknown[]) {
		this._log("debug", ...message)
	}

	public info(...message: unknown[]) {
		this._log("info", ...message)
	}

	public warn(...message: unknown[]) {
		this._log("warn", ...message)
	}

	public error(...message: unknown[]) {
		this._log("error", ...message)
	}
}

const logger = new Logger()

export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)

export default logger
