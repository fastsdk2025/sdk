import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";
import ConfigService from "../config/ConfigService";
import OSS, { Options, PutObjectResult } from "ali-oss";
import { basename } from "node:path";
import { stat } from "node:fs/promises";
import { OSSCloudConfig } from "../config/types";
import { getDefaultAutoSelectFamilyAttemptTimeout } from "node:net";

export default class UploadService extends Service {
  protected logger!: LoggerService;
  protected config!: ConfigService;
  protected options!: Options;
  protected client!: OSS;
  protected ossConfig?: OSSCloudConfig;
  private initialized = false;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");

    this.ossConfig = this.config.get("cloud").oss;
    if (!this.ossConfig) {
      this.logger.error("No cloud.oss configuration found.");
      throw new Error("OSS configuration is required for UploadService.");
    }

    this.logger.debug("cloud.oss configuration: ", this.ossConfig);

    this.options = this.buildOSSOptions(this.ossConfig);
    this.client = new OSS(this.options);
    this.initialized = true;
  }

  private buildOSSOptions(config: OSSCloudConfig): Options {
    const options: Options = {
      region: config.region,
      accessKeyId: config.apiKey,
      accessKeySecret: config.apiKeySecret,
      bucket: config.bucket,
    };

    if (config.domain) {
      options.endpoint = config.domain;
      options.cname = true;
      options.secure = true;
    }

    return options;
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error("UploadService is not initialized.");
    }
  }

  public async uploadFile(file: string, destName?: string) {
    this.ensureInitialized();

    await this.validateFile(file);

    const objectName = destName || basename(file);
    const maxAttempts = this.getMaxRetries();

    return this.uploadWithRetry(file, objectName, maxAttempts);
  }

  private async validateFile(file: string) {
    try {
      const fileInfo = await stat(file);
      if (!fileInfo.isFile()) {
        throw new Error("Path is not a regular file");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`File not found: ${file}`);
      }
      throw new Error(`File validation failed: ${(error as Error).message}`);
    }
  }

  private getMaxRetries(): number {
    if (typeof this.ossConfig?.uploadRetries === "number") {
      return Math.max(1, Math.floor(this.ossConfig.uploadRetries));
    }
    return 3;
  }

  private async uploadWithRetry(
    file: string,
    objectName: string,
    maxAttempts: number,
  ) {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(
          `Uploading "${file}" as "${objectName}" (attempt ${attempt}/${maxAttempts})`,
        );

        const result = await this.client.put(objectName, file);
        const url = this.buildResultUrl(result, objectName);

        this.logger.info("Upload succeeded: ", url);
        return url;
      } catch (error) {
        lastError = error;
        this.logger.debug(
          `Upload attempt ${attempt} failed: ${(error as Error).message}`,
        );

        if (attempt < maxAttempts) {
          await this.waitForRetry(attempt);
        }
      }
    }

    throw new Error(
      `Failed to upload "${file}" after ${maxAttempts} attempts: ${(lastError as Error).message}`,
      {
        cause: lastError,
      },
    );
  }

  private buildResultUrl(result: PutObjectResult, objectName: string): string {
    if (result.url) {
      return result.url;
    }

    const secure = this.options.secure ?? true;
    const proto = secure ? "https" : "http";

    if (this.options.endpoint) {
      const host = this.options.endpoint
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      return `${proto}://${host}/${objectName}`;
    }
    return `${proto}://${this.options.bucket}.${this.options.region}.aliyuncs.com/${objectName}`;
  }

  private async waitForRetry(attempt: number): Promise<void> {
    const backoffMs = 500 * Math.pow(2, attempt - 1);
    this.logger.debug(`Retrying in ${backoffMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  public async uploadMultiple(
    files: string[],
    destNames?: string[],
  ): Promise<string[]> {
    this.ensureInitialized();

    const uploads = files.map((file: string, index: number) => {
      return this.uploadFile(file, destNames?.[index]);
    });

    return Promise.all(uploads);
  }
}
