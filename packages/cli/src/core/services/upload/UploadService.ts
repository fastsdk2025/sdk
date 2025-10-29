import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";
import ConfigService from "../config/ConfigService";
import OSS, { Options } from "ali-oss";
import { basename } from "node:path";
import { stat } from "node:fs/promises";
import { OSSCloudConfig } from "../config/types";

export default class UploadService extends Service {
  protected logger!: LoggerService;
  protected config!: ConfigService;
  protected options!: Options;
  protected client!: OSS;
  protected ossConfig?: OSSCloudConfig;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");

    this.ossConfig = this.config.get("cloud").oss;
    if (!this.ossConfig) {
      this.logger.error("No cloud.oss configuration found.");
      process.exit(1);
    }

    this.logger.debug("cloud.oss configuration: ", this.ossConfig);

    this.options = {
      region: this.ossConfig.region,
      accessKeyId: this.ossConfig.apiKey,
      accessKeySecret: this.ossConfig.apiKeySecret,
      bucket: this.ossConfig.bucket,
    };

    if (this.ossConfig.domain) {
      this.options.endpoint = this.ossConfig.domain;
      this.options.cname = true;
      this.options.secure = true;
    }

    this.client = new OSS(this.options);
  }

  public async uploadFile(file: string, destName?: string) {
    try {
      const fileInfo = await stat(file);
      if (!fileInfo.isFile()) {
        this.logger.error("File is not a regular file.");
        process.exit(1);
      }
    } catch (error) {
      this.logger.error(`File not found or inaccessible: ${file}`);
      process.exit(1);
    }
    const objectName = destName || basename(file);

    const maxAttempts =
      typeof this.ossConfig?.uploadRetries === "number"
        ? Math.max(1, Math.floor(this.ossConfig.uploadRetries))
        : 3;

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(
          `Uploading "${file}" as "${objectName}" (attempt ${attempt}/${maxAttempts})`,
        );

        const result = await this.client.put(objectName, file);

        let url = result.url ?? "";
        if (!url) {
          const endpoint = this.options.endpoint ?? "";
          const secure = this.options.secure;
          const proto = secure ? "https" : "http";
          const host = endpoint.replace(/^https:\/\//, "").replace(/\/$/, "");

          url = host
            ? `${proto}://${host}/${objectName}`
            : result.name
              ? `${proto}://${this.options.bucket}.${this.options.region}.aliyuncs.com/${objectName}`
              : "";
        }
        this.logger.info("Upload successded: ", url);
        return url;
      } catch (error) {
        lastError = error;
        this.logger.debug(
          `Upload attempt ${attempt} failed: ${(error as Error).message}.`,
        );

        if (attempt < maxAttempts) {
          const backoffMs = 500 * Math.pow(2, attempt - 1);
          this.logger.debug(`Retrying in ${backoffMs}ms...`);
          await new Promise((resolve) => {
            return setTimeout(resolve, backoffMs);
          });
          continue;
        }
      }
    }

    throw new Error(
      `Failed to upload "${file}" after ${maxAttempts} attempts: ${(lastError as Error).message}`,
    );
  }
}
