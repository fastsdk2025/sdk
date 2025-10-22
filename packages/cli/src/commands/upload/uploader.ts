import OSS, { type Options } from "ali-oss";
import { ConfigManager } from "../../utils/config/ConfigManager";
import { createLogger } from "../../utils/logger";
import { basename } from "node:path";
import { stat } from "node:fs/promises";

export async function uploader(file: string, destName?: string) {
  const logger = createLogger("info", "Uploader");
  const config = ConfigManager.getInstance();
  const ossConfig = config.get("cloud").oss;

  if (!ossConfig) {
    logger.error("No cloud.oss configuration found");
    process.exit(1);
  }

  logger.debug("cloud.oss configuration: ", ossConfig);

  try {
    const stats = await stat(file);
    if (!stats.isFile()) {
      logger.error("File is not a regular file");
      process.exit(1);
    }
  } catch (error) {
    logger.error(`File not found or inaccessible: ${file}`, error);
    process.exit(1);
  }

  const options: Options = {
    region: ossConfig.region,
    accessKeyId: ossConfig.apiKey,
    accessKeySecret: ossConfig.apiKeySecret,
    bucket: ossConfig.bucket,
  };

  if (ossConfig.domain) {
    options.endpoint = ossConfig.domain;
    options.cname = true;
    options.secure = true;
  }
  const client = new OSS(options);
  const objectName = destName || basename(file);

  const maxAttempts =
    typeof ossConfig.uploadRetries === "number"
      ? Math.max(1, Math.floor(ossConfig.uploadRetries))
      : 3;

  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(
        `Uploading "${file}" as "${objectName}" (attempt ${attempt}/${maxAttempts})`,
      );

      const result = await client.put(objectName, file);

      let url = result.url ?? "";
      if (!url) {
        const endpoint = options.endpoint ?? "";
        const secure = options.secure;
        const proto = secure ? "https" : "http";
        const host = endpoint.replace(/^https:\/\//, "").replace(/\/$/, "");

        url = host
          ? `${proto}://${host}/${objectName}`
          : result.name
            ? `${proto}://${options.bucket}.${options.region}.aliyuncs.com/${objectName}`
            : "";
      }
      logger.info("Upload succeeded:", url);
      return url;
    } catch (error) {
      lastErr = error;

      logger.debug(
        `Upload attempt ${attempt} failed: ${(error as Error).message}`,
      );

      if (attempt < maxAttempts) {
        const backoffMs = 500 * Math.pow(2, attempt - 1);
        logger.debug(`Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }

  throw new Error(
    `Failed to upload "${file}" after ${maxAttempts} attempts: ${(lastErr as Error).message}`,
  );
}
