import { Command } from "commander";
import { ConfigId } from "../../types/xyx";
import { ResultOptions } from "./types";
import { ResultManager } from "./ResultManager";

const resultCommand = new Command();

resultCommand
  .name("result")
  .description("显示<configId>平台构建后发布结果")
  .argument("<configId>", "平台配置ID")
  .option("--log-level", "日志级别", "info")
  .option("-m, --message [message]", "更新日志")
  .action(async (configId: ConfigId, options: ResultOptions) => {
    console.log("ConfigID: ", configId);
    const result = new ResultManager(configId, options);
    await result.show();
  });

export default resultCommand;
