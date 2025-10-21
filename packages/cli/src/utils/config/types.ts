export type CloudType = "oss";

export interface OSSCloudConfig {
  region: string;
  apiKey: string;
  apiKeySecret: string;
  bucket: string;
}

export type CloudConfig = {
  oss?: Partial<OSSCloudConfig>;
};

export interface IConfig {
  cloud: CloudConfig;
}

export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? PathValue<T[Key], Rest>
      : never
    : never;

export type Paths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${Paths<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type ConfigPath = Paths<IConfig>;
