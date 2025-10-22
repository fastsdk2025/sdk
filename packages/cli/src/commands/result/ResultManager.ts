import { dirname, join } from "node:path";
import { ConfigId, PlatformConfig } from "../../types/xyx";
import { getWorkerDir } from "../../utils/getWorkerDir";
import { getXYXConfig } from "../../utils/getXYXConfig";
import Logger from "../../utils/logger/Logger";
import { LogLevelLiteral } from "../../utils/logger/types";
import { parseConfigId } from "../../utils/parseConfigId";
import { LinksResult, RenderCtx, ResultOptions } from "./types";
import { template } from "./template";
import { normalizeName } from "../../utils/normalizeName";
import { copy } from "../../utils/copy";
import { openEditorAndRead } from "../../utils/openEditorAndRead";
import { uploader } from "../upload/uploader";
import { readdir } from "node:fs/promises";

export class ResultManager {
  private readonly logLevel!: LogLevelLiteral;
  private readonly message!: string | boolean;
  private readonly logger!: Logger;

  private readonly remotePrefix = "heigame/hippoo";
  private templateStr: string = template;

  constructor(
    private readonly configId: ConfigId,
    private readonly options: ResultOptions,
  ) {
    const { logLevel = "info", message = false } = options;

    this.logLevel = logLevel;
    this.message = message;

    this.logger = Logger.createLogger(this.logLevel, "ResultManager");
  }

  private async uploadZip(
    projectBase: string,
    configId: string,
    cyProjectName: string,
    cfg: PlatformConfig,
  ): Promise<string> {
    const platformDir = join(projectBase, "platform");
    try {
      const entries = await readdir(platformDir);
      const suffix = `${cyProjectName.toLowerCase()}-${cfg.version_name}.zip`;
      const normalizedId = normalizeName(configId);

      const candidate = entries.find((name) => {
        return [normalizedId, configId].some(
          (id) => name === `${id}-${suffix}`,
        );
      });

      if (!candidate) {
        this.logger.warn("No matching zip file found");
      }

      const localPath = join(platformDir, candidate as string);
      const remoteName = normalizeName(candidate as string);
      const remotePath = join(this.remotePrefix, remoteName);

      this.logger.debug("Prepare to upload: ");
      this.logger.debug("Local Path: ", localPath);
      this.logger.debug("Remote Path: ", remotePath);

      const resultUrl = await uploader(localPath, remotePath);
      this.logger.info(`Uploaded to ${resultUrl}`);

      return resultUrl;
    } catch (error) {
      this.logger.error("Failed to upload zip file", error);
    }

    return "";
  }

  private buildLinks(configId: string, online_url: string): LinksResult {
    const { publisher } = parseConfigId(configId);

    const hostname = publisher ? `${publisher}game` : "hnyigegame";
    const host = `http://twww.${hostname}.com/h5games/${hostname}`;

    const url = new URL(online_url);

    const cyProjectName = dirname(url.pathname).replace(/^\//, "");

    return {
      official_advertising_link: `${join(host, cyProjectName, "index.html")}?env=pre`,
      test_advertising_link: `${join(host, cyProjectName, "index.html")}?env=pre&ad_env=preview`,
      game_url: url.href,
      cyProjectName,
    };
  }

  private render(ctx: Partial<RenderCtx>) {
    (Object.keys(ctx) as Array<keyof RenderCtx>).forEach(
      (key: keyof RenderCtx) => {
        const value = ctx[key] ?? "";
        this.templateStr = this.templateStr.replace(
          new RegExp(`{{${key}}}`, "g"),
          value,
        );
      },
    );

    return this.templateStr;
  }

  private async buildChangelog() {
    if (this.message === true) {
      return await openEditorAndRead("输入发布说明,保存退出即可");
    }
    if (typeof this.message === "string") {
      return (
        "更新日志: \n" +
        this.message
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => `- ${t}`)
          .join("\n")
      );
    }

    return "";
  }

  public async show(): Promise<void> {
    const projectBase = getWorkerDir(process.cwd(), "xyx.config.json");
    if (!projectBase) {
      this.logger.error(
        `Could not find xyx.config.json in ${process.cwd()} or any parent directory`,
      );
      process.exit(1);
    }

    this.logger.debug("configId: ", this.configId);
    this.logger.debug("options: ", this.options);
    this.logger.debug("projectBase: ", projectBase);

    const xyxConfig = getXYXConfig(projectBase);

    const cfg = xyxConfig[this.configId];

    if (!cfg) {
      this.logger.error(`configId ${this.configId} not found`);
      process.exit(1);
    }

    const links = this.buildLinks(this.configId, cfg.online_url as string);
    const ctx: Partial<RenderCtx> = {
      ...links,
      project_name: cfg.project_name,
      platform: `[${this.configId}]`,
      version: cfg.version_name,
      package_download_address: await this.uploadZip(
        projectBase,
        this.configId,
        links.cyProjectName,
        cfg,
      ),
      changelog: await this.buildChangelog(),
    };

    this.logger.debug(`renderCtx: `, ctx);

    let final = this.render(ctx);
    this.logger.info(final);
    copy(final);
    process.exit(0);
  }
}
