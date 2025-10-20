import { LogLevelLiteral } from "../../utils/logger/types";

export interface ResultOptions {
  logLevel: LogLevelLiteral;
  message?: string | boolean;
}
