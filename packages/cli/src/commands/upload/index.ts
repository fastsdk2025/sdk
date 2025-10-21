import OSS, { type Options } from "ali-oss"
import { Command } from "commander";
import { ConfigManager } from "../../utils/config/ConfigManager";
import Logger from "../../utils/logger/Logger";
import { basename } from "node:path";

const uploadCommand = new Command("upload")
  .argument("<file>", "Upload a file")
  .description("Upload files to the cloud")
  .action(async (file: string) => {
    console.log("Uploading files...");
    const logger = Logger.createLogger("info", "Uploader")
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

    logger.info(result.url)
  });

export default uploadCommand;
