import OSS, { type Options } from "ali-oss"
import { ConfigManager } from "../../utils/config/ConfigManager"
import { createLogger } from "../../utils/logger"
import { basename } from "node:path"

export async function uploader(file: string) {
  const logger = createLogger("info", "Uploader")
  const config = ConfigManager.getInstance()
  const ossConfig = config.get("cloud").oss
  if (!ossConfig) {
    logger.error("No cloud configuration found")
    process.exit(0)
  }
  logger.debug(config.get("cloud"))
  const options: Options = {
    region: ossConfig.region,
    accessKeyId: ossConfig.apiKey,
    accessKeySecret: ossConfig.apiKeySecret,
    bucket: ossConfig.bucket,
  }

  if (ossConfig.domain) {
    options.endpoint = ossConfig.domain;
    options.cname = true;
    options.secure = true
  }
  const client = new OSS(options)

  const result = await client.put(basename(file), file)

  logger.info("Upload file: ", result.url)
  return result.url
}
