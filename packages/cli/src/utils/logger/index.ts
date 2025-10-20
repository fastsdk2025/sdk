import Logger from "./Logger";

const logger = Logger.createLogger();
const createLogger = Logger.createLogger.bind(Logger);

export { logger, createLogger };
