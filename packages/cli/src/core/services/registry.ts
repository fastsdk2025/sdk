import ConfigService from "./config/ConfigService";
import LoggerService from "./logger/LoggerService";
import UploadService from "./upload/UploadService";

export const serviceDefinitions = {
  logger: LoggerService,
  config: ConfigService,
  upload: UploadService,
} as const;

export type ServiceRegistry = {
  [K in keyof typeof serviceDefinitions]: InstanceType<
    (typeof serviceDefinitions)[K]
  >;
};

export type ServiceName = keyof typeof serviceDefinitions;

export type ServiceConstructor = (typeof serviceDefinitions)[ServiceName];
