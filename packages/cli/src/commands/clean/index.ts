import { Command } from "commander";
import { ConfigId } from "../../types/xyx";
import { CleanOptions } from "./types";
import Cleanup from "./Cleanup"

const cleanCommand = new Command();

cleanCommand
  .name("clean")
  .description("清理指定平台的项目目录")
  .argument("<configId>", "平台配置ID")
  .option("--log-level", "指定日志等级", "info")
  .action(async (configId: ConfigId, options: CleanOptions) => {
    const cleanup = new Cleanup(options)

    await cleanup.clean(configId)
  });

export default cleanCommand;
