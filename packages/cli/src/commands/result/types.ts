import { InvalidOptionArgumentError } from "commander";
import { LogLevelLiteral } from "../../utils/logger/types";

export interface ResultOptions {
  logLevel: LogLevelLiteral;
  message: string | boolean;
}

export interface LinksResult {
  official_advertising_link: string;
  test_advertising_link: string;
  game_url: string;
  cyProjectName: string;
}

export interface RenderCtx extends Omit<LinksResult, "cyProjectName"> {
  project_name: string;
  platform: string;
  version: string;
  package_download_address: string;
  changelog: string;
}
