import { dirname, join } from "node:path";
import { ConfigId } from "../../types/xyx";
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
import { readdir, stat } from "node:fs/promises";

export class ResultManager {
  private readonly logLevel!: LogLevelLiteral;
  private readonly message!: string | boolean;
  private readonly logger!: Logger;

  private readonly remotePrefix = "heigame/hippoo";
  private readonly templateStr: string = template;

  private result!: string;

  constructor(
    private readonly configId: ConfigId,
    private readonly options: ResultOptions,
  ) {
    const { logLevel = "info", message = false } = options;

    this.logLevel = logLevel;
    this.message = message;
    this.result = template;

    this.logger = Logger.createLogger(this.logLevel, "ResultManager");
  }

  private async uploadZip(
    projectBase: string,
    packageDownloadName: string,
  ): Promise<string> {
    const platformDir = join(projectBase, "platform");
    const expectedLocal = join(platformDir, packageDownloadName);

    try {
      const st = await stat(expectedLocal);
      if (st.isFile()) {
        this.logger.debug(`Found expected zip at ${expectedLocal}`);
        const remoteName = normalizeName(packageDownloadName);
        const remotePath = join(platformDir, remoteName);
        this.logger.debug(`Normalized remote name: ${remoteName}`);
        return await uploader(expectedLocal, remotePath);
      }
      this.logger.debug(
        `Expected path exists but is not a file: ${expectedLocal}`,
      );
    } catch (error) {
      this.logger.debug(
        `Expected zip not found at ${expectedLocal}: ${String(error)}`,
      );
    }

    try {
      const entries = await readdir(platformDir);
      const candidate = entries.find((name) => {
        return (
          name === packageDownloadName ||
          name.startsWith(packageDownloadName) ||
          name.includes(packageDownloadName.replace(/\.zip$/, ""))
        );
      });

      if (candidate) {
        const candidatePath = join(platformDir, candidate);
        try {
          const st2 = await stat(candidatePath);
          if (st2.isFile()) {
            this.logger.debug(`Found fallback zip at ${candidatePath}`);
            const remoteName = normalizeName(candidate);
            const remotePath = join(this.remotePrefix, remoteName);
            return await uploader(candidatePath, remotePath);
          }
        } catch (error) {
          this.logger.debug(
            `Candidate found but stat failed: ${candidatePath}`,
          );
        }
      } else {
        this.logger.error(
          `No matching zip found in platfor dir: ${platformDir}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to read platform dir ${platformDir}: ${String(error)}`,
      );
    }

    process.exit(1);
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
      package_download_address: `${configId}-${cyProjectName.toLocaleLowerCase()}-`,
      game_url: url.href,
      cyProjectName,
    };
  }

  private render(ctx: Partial<RenderCtx>) {
    (Object.keys(ctx) as Array<keyof RenderCtx>).forEach(
      (key: keyof RenderCtx) => {
        const value = ctx[key] ?? "";
        this.result = this.result.replace(new RegExp(`{{${key}}}`, "g"), value);
      },
    );

    return this.result;
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
      package_download_address: `${links.package_download_address}${cfg.version_name}.zip`,
    };

    const zipPath = await this.uploadZip(
      projectBase,
      ctx.package_download_address!,
    );

    ctx.package_download_address = zipPath;

    this.logger.debug(`renderCtx: `, ctx);
    let result = this.render(ctx);

    let changelog = "";
    if (this.message === true) {
      changelog = await openEditorAndRead("输入发布说明,保存退出即可");
    } else if (typeof this.message === "string") {
      changelog = "更新日志：\n";
      this.message
        .split(/[;；]+/)
        .map((t) => t.trim())
        .forEach((msg) => {
          changelog += `+ ${msg}\n`;
        });
    }

    result = this.render({
      changelog: changelog || "",
    });

    this.logger.info(result);

    copy(result);

    process.exit(0);
  }
}
