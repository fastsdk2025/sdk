import { Command } from "commander";
import { ConfigId, XYXTemplateData } from "../../types/xyx";
import { parseConfigId } from "../../utils/parseConfigId";
import { getWorkerDir } from "../../utils/getWorkerDir";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { readJSON } from "../../utils/readJSON";
import { existsSync, rmSync } from "node:fs";
import { walkFile } from "../../utils/walkFile";

const cleanCommand = new Command();

cleanCommand
  .name("clean")
  .argument("<configId>", "平台配置ID")
  .action(async (configId: ConfigId) => {
    console.log("开始清除项目");
    const xyxPath = getWorkerDir(process.cwd(), "xyx.config.json");
    if (!xyxPath) {
      throw new Error(
        `Could not find xxy.config.json in ${process.cwd()} or any parent directory`,
      );
    }

    const projectBase = dirname(xyxPath);
    let platformDir = join(projectBase, "platform", configId);
    const templateDataPath = join(
      homedir(),
      ".xyx-cli",
      "template",
      "data.json",
    );
    const templateData = readJSON<XYXTemplateData>(templateDataPath);
    const templatePath = join(
      dirname(templateDataPath),
      `xyx-template-${templateData.cachedVersion}`,
    );

    if (existsSync(templatePath)) {
      const { platform } = parseConfigId(configId);
      let platformTemplateCommonPath = join(templatePath, "common", platform);
      if (platform === "hippoo") {
        platformTemplateCommonPath = join(platformTemplateCommonPath, "game");
        platformDir = join(platformDir, "game");
      }

      const targetFiles = walkFile(platformTemplateCommonPath);
      walkFile(
        platformDir,
        (file: string) => {
          console.log("删除文件: ", file);
          rmSync(file, {
            recursive: true,
            force: true,
          });
        },
        {
          fileFilter(file: string) {
            return targetFiles
              .map((t) => t.replace(platformTemplateCommonPath, ""))
              .includes(file.replace(platformDir, ""));
          },
        },
      );
    } else {
      throw new Error(`Template not found at ${templatePath}`);
    }
    console.log("清除项目完成");
  });

export default cleanCommand;
