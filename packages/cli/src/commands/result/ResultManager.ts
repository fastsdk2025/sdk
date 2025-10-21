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

export class ResultManager {
  private readonly logLevel!: LogLevelLiteral;
  private readonly message!: string | boolean;
  private readonly logger!: Logger;

  constructor(
    private readonly configId: ConfigId,
    private readonly options: ResultOptions,
  ) {
    const { logLevel = "info", message = false } = options;

    this.logLevel = logLevel;
    this.message = message;

    this.logger = Logger.createLogger(this.logLevel, "ResultManager");
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
      package_download_address: `${normalizeName(configId)}-${cyProjectName.toLocaleLowerCase()}-`,
      game_url: url.href,
      cyProjectName,
    };
  }

  private render(ctx: RenderCtx) {
    let out = template;

    (Object.keys(ctx) as Array<keyof RenderCtx>).forEach(
      (key: keyof RenderCtx) => {
        const value = ctx[key] ?? "";
        out = out.replace(new RegExp(`{{${key}}}`, "g"), value);
      },
    );

    return out;
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
    const ctx: RenderCtx = {
      ...links,
      project_name: cfg.project_name,
      platform: `[${this.configId}]`,
      version: cfg.version_name,
      package_download_address: `${links.package_download_address}${cfg.version_name}.zip`,
    };

    this.logger.debug(`renderCtx: `, ctx);
    const result = this.render(ctx);
    console.log(result);
    this.logger.info(result);
  }
}
