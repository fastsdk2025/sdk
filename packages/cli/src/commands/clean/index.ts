import { Command } from "commander";
import { ConfigId, XYXTemplateData } from "../../types/xyx";
import { parseConfigId } from "../../utils/parseConfigId";
import { getWorkerDir } from "../../utils/getWorkerDir";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { readJSON } from "../../utils/readJSON";
import { existsSync, rmSync } from "node:fs";
import { walkFile } from "../../utils/walkFile";
import { createLogger } from "../../utils/logger";
import { log } from "node:console";

const cleanCommand = new Command();

cleanCommand
  .name("clean")
  .argument("<configId>", "平台配置ID")
  .action(async (configId: ConfigId) => {
    const logger = createLogger("info", "Clean");
    logger.info("Start clearing the project: ", configId);
    const projectBase = getWorkerDir(process.cwd(), "xyx.config.json");
    if (!projectBase) {
      logger.error(
        `Could not find xxy.config.json in ${process.cwd()} or any parent directory`,
      );
      process.exit(1);
    }

    logger.debug("project base: ", projectBase);

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

    logger.debug("template path: ", templatePath);

    if (existsSync(templatePath)) {
      const { platform } = parseConfigId(configId);
      let platformTemplateCommonPath = join(templatePath, "common", platform);
      if (platform === "hippoo") {
        platformTemplateCommonPath = join(platformTemplateCommonPath, "game");
        platformDir = join(platformDir, "game");
      }

      logger.debug("need remove directory: ", platformDir);
      const targetFiles = walkFile(platformTemplateCommonPath);
      walkFile(
        platformDir,
        (file: string) => {
          logger.info("Remove file: ", file);
          rmSync(file, {
            recursive: true,
            force: true,
          });
        },
        {
          fileFilter(file: string) {
            return !targetFiles
              .map((t) => t.replace(platformTemplateCommonPath, ""))
              .includes(file.replace(platformDir, ""));
          },
        },
      );
    } else {
      logger.error(`Template not found at ${templatePath}`);
      process.exit(1);
    }
    logger.info("Clear project complete");
  });

export default cleanCommand;
