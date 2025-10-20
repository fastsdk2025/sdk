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
  console.log("parse: ", platform, channel);

  if (channel) {
    [channel, publisher] = channel.split("#") as [Channel, Publisher];
    console.log("parse: ", channel, publisher);
  } else {
    [platform, publisher] = platform.split("#") as [Platform, Publisher];
  }

  console.log(platform, channel, publisher);

  return {
    platform,
    channel,
    publisher,
  };
}
