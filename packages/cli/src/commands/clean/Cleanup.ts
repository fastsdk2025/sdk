import { dirname, join } from "node:path";
import { ConfigId, XYXTemplateData } from "@/types/xyx";
import { getWorkerDir } from "@utils/getWorkerDir";
import Logger from "@utils/logger/Logger";
import { CleanOptions } from "./types";
import { homedir } from "node:os";
import { readJSON } from "@utils/readJSON";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { parseConfigId } from "@utils/parseConfigId";

class Cleanup {
  private readonly logger!: Logger;
  private templatePath!: string;

  constructor(options: CleanOptions) {
    this.logger = Logger.createLogger(options.logLevel, "Cleanup");
  }

  private getTemplatePath() {
    const templateDataPath = join(
      homedir(),
      ".xyx-cli",
      "template",
      "data.json",
    );
    if (!existsSync(templateDataPath)) {
      this.logger.error("Template data file not found.");
      process.exit(1);
    }
    const templateData = readJSON<XYXTemplateData>(templateDataPath);
    const templatePath = join(
      dirname(templateDataPath),
      `xyx-template-${templateData.cachedVersion}`,
    );

    this.logger.debug("template path: ", templatePath);
    return templatePath;
  }

  public async clean(configId: ConfigId): Promise<void> {
    this.logger.info("Project cleanup started for config ID:", configId);

    // 获取项目根目录
    const projectBase = getWorkerDir(process.cwd(), "xyx.config.json");
    if (!projectBase) {
      this.logger.error(
        `Could not find xxy.config.json in ${process.cwd()} or any parent directory`,
      );
      process.exit(1);
    }

    // 获取模板地址
    this.templatePath = this.getTemplatePath();

    const { platform } = parseConfigId(configId);
    let targetDir = join(projectBase, "platform", configId);
    let platformTemplateCommonPath = join(
      this.templatePath,
      "common",
      platform,
    );

    if (platform === "hippoo") {
      platformTemplateCommonPath = join(platformTemplateCommonPath, "game");
      targetDir = join(targetDir, "game");
    }

    const platformFiles = readdirSync(platformTemplateCommonPath);
    const targetFiles = readdirSync(targetDir);

    targetFiles
      .filter((t) => {
        return !platformFiles.includes(t);
      })
      .forEach((name) => {
        const fullPath = join(targetDir, name);
        this.logger.info("Remove File: ", fullPath);
        rmSync(fullPath, {
          recursive: true,
          force: true,
        });
      });

    this.logger.info("Project cleanup completed.");
  }
}

export default Cleanup;
