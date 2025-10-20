export enum Platform {
  vivo = "vivo",
  oppo = "oppo",
  tt = "tt",
  mz = "mz",
  qq = "qq",
  hw = "hw",
  honor = "honor",
  cordova = "cordova",
  xlb = "xlb",
  web = "web",
  game2345 = "2345",
  ks = "ks",
  kwai = "kwai",
  mi = "mi",
  wx = "wx",
  jd = "jd",
  gpt = "gpt",
  afg = "afg",
  hippoo = "hippoo",
  botim = "botim",
  harmony = "harmony",
}
export type Channel = string;
export type Publisher = string;
export type ConfigId = string;

export interface ConfigInfo {
  platform: Platform;
  channel: Channel;
  publisher: Publisher;
}

export enum Framework {
  c2 = "c2", // Construct2
  c3 = "c3", // Construct3
  egret = "egret", // Egret
  laya = "laya", // Laya
  phaser = "phaser", // Phaser
  createjs = "createjs", // CreateJs
  famobi = "famobi", // Famobi
  openfl = "openfl",
  cocos = "cocos",
  cocos2djs = "cocos2djs",
  playcanvas = "playcanvas",
  pixi = "pixi",
  unity = "unity",
  impactjs = "impactjs",
  defold = "defold",
  gamemaker = "gamemaker",
  unknown = "unknown",
  threejs = "threejs",
  scratch = "scratch",
}

export enum Orientation {
  portrait = "portrait",
  landscape = "landscape",
}

export interface CommonConfig {
  package_name: string;
  project_name: string;
  project_description: string;
  orientation: Orientation;
  logo: string;
  framework: Framework;
  plugins: string[];
  gameMainFileName: string;
  moduleWithoutRequire: string[];
  useVM: boolean;
  disabledVMAPI?: string[];
  libVersion: string;
  // 定义哪些模块会在以 worker 形式加载使用
  modulesAsWorker?: string[];
}

export interface PlatformConfig {
  project_id: string;
  min_platform_version: string;
  project_name: string;
  version_name: string;
  version_code: string | number;
  home_page?: string;

  // 手动指定的 src 目录和平台目录的映射
  resource_map: Array<[string, string]>;

  /**
   * 有些时候，从 src 目录拷贝资源到其他平台目录下时，某些资源不需要拷贝
   * 这个时候就需要使用 resource_need_rm 来指定不需要拷贝的资源
   * 所以 resource_need_rm 是以平台目录为基准的
   */
  resource_need_rm?: string[];

  /**
   * 有些时候我们已经基于 pkg-map.json 对 src 目录做了重构
   * 但是在拷贝资源到其他平台目录下时，某些平台可能不需要这样的划分结构
   * 这个时候就需要使用 reverse_pkg_map 来逆向 pkg-map.json 的映射
   * reverse_pkg_map 就是这个功能的开关
   * pkg_map 指向的是 pkg-map.json 的路径
   * reverse_pkg_map_target 是逆向映射之后的目标路径
   */
  reverse_pkg_map?: boolean;
  pkg_map?: string;
  reverse_pkg_map_target?: string;

  /**
   * 有些时候，我们不希望改变 src 的目录结构
   * 但是在拷贝资源到其他平台目录下时，某些平台可能需要这样的划分结构
   * 这个时候就需要使用 pkg-map.json 来将 src 目录下的文件映射到其他平台目录下
   * pkg_map 指向的是 pkg-map.json 的路径
   * positive_pkg_map_target 是映射之后的目标路径
   * positive_pkg_map 是这个功能的开关
   */
  positive_pkg_map?: boolean;
  positive_pkg_map_target?: string;

  // 游戏线上地址
  online_url?: string;

  // 用于实现自定义的分包功能
  bundleConfig?: {
    // 自定义分包的配置文件路径
    configPath: string;
    // 自定义分包输出的根路径
    bundleTarget: string;
    // 是否保留原始文件(默认：true)
    keepOriginal?: boolean;
  };

  // 游戏上传预览等需要的密钥，暂时只有 jd 平台需要
  request_token?: string;
}

export type XYXConfig = {
  common: CommonConfig;
} & {
  [key: ConfigId]: PlatformConfig;
};

export interface XYXTemplateData {
  cachedVersion: string;
  lastUpdate: number;
  latestVersion: string;
  latestVersionCheck: number;
}
