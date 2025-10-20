import {
  ConfigId,
  ConfigInfo,
  Platform,
  Channel,
  Publisher,
} from "../types/xyx";

/**
 * 解析 configID
 * @param {ConfigId} configId 配置ID
 * @returns {ConfigInfo}
 */
export function parseConfigId(configId: ConfigId): ConfigInfo {
  let platform: Platform;
  let channel: Channel = "";
  let publisher: Publisher = "";

  [platform, channel] = configId.split("@") as [Platform, Channel];

  if (channel) {
    [channel, publisher] = channel.split("#") as [Channel, Publisher];
  }

  return {
    platform,
    channel,
    publisher,
  };
}
