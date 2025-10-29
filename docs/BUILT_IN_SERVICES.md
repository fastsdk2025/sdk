# 内置服务文档

本文档详细介绍 Fast CLI 框架提供的所有内置服务。

## 目录

- [LoggerService (日志服务)](#loggerservice-日志服务)
- [ConfigService (配置服务)](#configservice-配置服务)
- [UploadService (上传服务)](#uploadservice-上传服务)

---

## LoggerService (日志服务)

LoggerService 提供了带颜色和级别的日志输出功能。

### 基本信息

- **服务名称**: `"logger"`
- **文件路径**: `src/core/services/logger/LoggerService.ts`
- **依赖**: 无

### 功能特性

- ✅ 多种日志级别 (debug, info, warn, error, silent)
- ✅ 彩色输出
- ✅ 时间戳
- ✅ 日志级别过滤
- ✅ 自定义输出流

### 日志级别

```typescript
type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
```

| 级别 | 优先级 | 颜色 | 用途 |
|------|--------|------|------|
| debug | 10 | 蓝色 | 调试信息 |
| info | 20 | 绿色 | 常规信息 |
| warn | 30 | 黄色 | 警告信息 |
| error | 40 | 红色 | 错误信息 |
| silent | -1 | - | 静默模式 |

**优先级规则**: 只显示 >= 当前级别的日志

例如：设置为 `warn` 时，只显示 `warn` 和 `error`

### API 参考

#### `info(...args: unknown[]): void`

输出信息级别的日志。

**参数**:
- `...args: unknown[]` - 要输出的内容

**示例**:
```typescript
const logger = this.requireService("logger");

logger.info("应用启动成功");
logger.info("用户登录:", { username: "Alice", id: 123 });
logger.info("处理完成", "耗时:", 1234, "ms");
```

**输出**:
```
[2024-01-01 10:00:00] INFO 应用启动成功
[2024-01-01 10:00:00] INFO 用户登录: { username: 'Alice', id: 123 }
[2024-01-01 10:00:00] INFO 处理完成 耗时: 1234 ms
```

---

#### `debug(...args: unknown[]): void`

输出调试级别的日志。

**参数**:
- `...args: unknown[]` - 要输出的内容

**示例**:
```typescript
logger.debug("变量值:", { x: 1, y: 2 });
logger.debug("执行步骤 1");
```

**输出**:
```
[2024-01-01 10:00:00] DEBUG 变量值: { x: 1, y: 2 }
[2024-01-01 10:00:00] DEBUG 执行步骤 1
```

---

#### `warn(...args: unknown[]): void`

输出警告级别的日志。

**参数**:
- `...args: unknown[]` - 要输出的内容

**示例**:
```typescript
logger.warn("配置项缺失，使用默认值");
logger.warn("API 调用即将超时");
```

**输出**:
```
[2024-01-01 10:00:00] WARN 配置项缺失，使用默认值
[2024-01-01 10:00:00] WARN API 调用即将超时
```

---

#### `error(...args: unknown[]): void`

输出错误级别的日志。

**参数**:
- `...args: unknown[]` - 要输出的内容

**示例**:
```typescript
logger.error("文件读取失败:", error);
logger.error("数据库连接失败");
```

**输出**:
```
[2024-01-01 10:00:00] ERROR 文件读取失败: Error: ENOENT
[2024-01-01 10:00:00] ERROR 数据库连接失败
```

---

#### `setLevel(level: LogLevelLiteral): void`

设置日志输出级别。

**参数**:
- `level: LogLevelLiteral` - 日志级别

**示例**:
```typescript
// 开发模式：显示所有日志
logger.setLevel("debug");

// 生产模式：只显示警告和错误
logger.setLevel("warn");

// 测试模式：完全静默
logger.setLevel("silent");
```

**级别过滤示例**:
```typescript
logger.setLevel("warn");

logger.debug("这不会显示"); // 不显示（优先级 10 < 30）
logger.info("这不会显示");  // 不显示（优先级 20 < 30）
logger.warn("这会显示");    // 显示（优先级 30 >= 30）
logger.error("这会显示");   // 显示（优先级 40 >= 30）
```

---

#### `getLevel(): LogLevelLiteral`

获取当前日志级别。

**返回**: `LogLevelLiteral`

**示例**:
```typescript
const currentLevel = logger.getLevel();
console.log(currentLevel); // "info"
```

---

#### `setOutput(output: typeof console.log): void`

设置自定义输出流。

**参数**:
- `output: typeof console.log` - 输出函数

**用途**: 
- 单元测试时捕获日志
- 输出到文件
- 自定义格式化

**示例**:
```typescript
// 输出到数组（用于测试）
const logs: any[][] = [];
logger.setOutput((...args) => logs.push(args));

logger.info("test");
console.log(logs); // [[timestamp, level, "test"]]

// 输出到文件
const fs = require("fs");
const stream = fs.createWriteStream("app.log");
logger.setOutput((...args) => {
  stream.write(args.join(" ") + "\n");
});
```

---

### 使用示例

#### 基础使用

```typescript
import Service from "@core/base/Service";

export default class MyService extends Service {
  private logger!: LoggerService;

  public onRegister(): void {
    this.logger = this.requireService("logger");
  }

  public async doSomething(): Promise<void> {
    this.logger.info("开始执行任务");
    
    try {
      // 执行任务
      this.logger.debug("任务详情:", { id: 123 });
      
      // 成功
      this.logger.info("任务完成");
    } catch (error) {
      this.logger.error("任务失败:", error);
      throw error;
    }
  }
}
```

#### 根据环境设置级别

```typescript
export default class MyService extends Service {
  public onRegister(): void {
    const logger = this.requireService("logger");
    
    // 根据环境变量设置日志级别
    const level = process.env.LOG_LEVEL || "info";
    logger.setLevel(level as LogLevelLiteral);
    
    // 或根据 NODE_ENV
    if (process.env.NODE_ENV === "production") {
      logger.setLevel("warn");
    } else if (process.env.NODE_ENV === "test") {
      logger.setLevel("silent");
    } else {
      logger.setLevel("debug");
    }
  }
}
```

#### 条件日志

```typescript
public processData(data: any[]): void {
  const logger = this.requireService("logger");
  
  logger.info(`处理 ${data.length} 条数据`);
  
  data.forEach((item, index) => {
    // 只在 debug 级别输出详细信息
    logger.debug(`处理第 ${index} 项:`, item);
    
    // 处理逻辑
    if (isInvalid(item)) {
      logger.warn(`第 ${index} 项数据无效:`, item);
    }
  });
  
  logger.info("数据处理完成");
}
```

---

## ConfigService (配置服务)

ConfigService 提供了持久化的配置管理功能，支持自动保存和防抖。

### 基本信息

- **服务名称**: `"config"`
- **文件路径**: `src/core/services/config/ConfigService.ts`
- **依赖**: `logger`
- **配置文件**: `~/.fast/config.json`

### 功能特性

- ✅ 自动加载和保存配置
- ✅ 防抖写入（100ms）
- ✅ 进程退出时自动保存
- ✅ 配置文件损坏时自动恢复
- ✅ 类型安全的键值访问

### 配置结构

```typescript
export interface IConfig {
  cloud: {
    oss?: {
      region: string;
      apiKey: string;
      apiKeySecret: string;
      bucket: string;
      domain?: string;
      uploadRetries?: number;
    };
  };
}
```

### API 参考

#### `get<K extends keyof IConfig>(key: K): IConfig[K]`

获取配置值。

**参数**:
- `key: keyof IConfig` - 配置键

**返回**: 配置值

**示例**:
```typescript
const config = this.requireService("config");

// 获取整个 cloud 配置
const cloudConfig = config.get("cloud");

// 访问嵌套属性
const ossConfig = config.get("cloud").oss;
if (ossConfig) {
  console.log(ossConfig.region);
  console.log(ossConfig.bucket);
}
```

---

#### `set<K extends keyof IConfig>(key: K, value: IConfig[K]): void`

设置配置值（自动保存）。

**参数**:
- `key: keyof IConfig` - 配置键
- `value: IConfig[K]` - 配置值

**行为**:
- 立即更新内存中的配置
- 100ms 后自动保存到文件（防抖）

**示例**:
```typescript
const config = this.requireService("config");

// 设置 OSS 配置
config.set("cloud", {
  oss: {
    region: "oss-cn-hangzhou",
    apiKey: "your-key",
    apiKeySecret: "your-secret",
    bucket: "my-bucket",
    domain: "https://cdn.example.com",
    uploadRetries: 3,
  }
});

// 配置会在 100ms 后自动保存到文件
```

---

#### `delete<K extends keyof IConfig>(key: K): void`

删除配置项（自动保存）。

**参数**:
- `key: keyof IConfig` - 配置键

**示例**:
```typescript
config.delete("cloud");
```

---

#### `has<K extends keyof IConfig>(key: K): boolean`

检查配置项是否存在。

**参数**:
- `key: keyof IConfig` - 配置键

**返回**: `boolean`

**示例**:
```typescript
if (config.has("cloud")) {
  console.log("云配置已设置");
} else {
  console.log("云配置未设置");
}
```

---

#### `save(): void`

立即保存配置到文件。

**用途**: 强制立即写入，跳过防抖

**示例**:
```typescript
config.set("cloud", { oss: { ... } });
config.save(); // 立即保存，不等待防抖
```

---

#### `flush(): void`

刷新配置（取消防抖并立即保存）。

**用途**: 
- 进程退出前强制保存
- 关键操作后确保持久化

**示例**:
```typescript
// 在进程退出前调用
process.on("exit", () => {
  config.flush();
});
```

---

#### `loadConfig(): void`

重新加载配置文件。

**用途**: 手动刷新配置（通常不需要）

**示例**:
```typescript
config.loadConfig();
```

---

### 使用示例

#### 初始化配置

```typescript
import CommandBase from "@core/base/CommandBase";

export default class InitCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("init")
      .description("初始化配置")
      .action(async () => {
        await this.handleInit();
      });
  }

  private async handleInit(): Promise<void> {
    const config = this.requireService("config");
    const logger = this.requireService("logger");

    // 检查是否已配置
    if (config.has("cloud") && config.get("cloud").oss) {
      logger.warn("配置已存在");
      return;
    }

    // 提示用户输入（示例）
    const ossConfig = {
      region: "oss-cn-hangzhou",
      apiKey: "your-api-key",
      apiKeySecret: "your-api-secret",
      bucket: "my-bucket",
    };

    // 保存配置
    config.set("cloud", { oss: ossConfig });

    logger.info("配置已保存到:", "~/.fast/config.json");
  }
}
```

#### 读取配置

```typescript
export default class UploadService extends Service {
  private ossConfig?: OSSCloudConfig;

  public onRegister(): void {
    const config = this.requireService("config");
    const logger = this.requireService("logger");

    // 读取配置
    this.ossConfig = config.get("cloud").oss;

    // 验证配置
    if (!this.ossConfig) {
      logger.error("OSS 配置未设置，请先运行: fast init");
      throw new Error("OSS configuration not found");
    }

    // 使用配置
    logger.debug("OSS 配置:", {
      region: this.ossConfig.region,
      bucket: this.ossConfig.bucket,
    });
  }
}
```

#### 更新配置

```typescript
export default class ConfigCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("config")
      .description("管理配置")
      .command("set")
      .argument("<key>", "配置键")
      .argument("<value>", "配置值")
      .action(async (key: string, value: string) => {
        await this.handleSet(key, value);
      });
  }

  private async handleSet(key: string, value: string): Promise<void> {
    const config = this.requireService("config");
    const logger = this.requireService("logger");

    // 更新配置
    if (key === "region") {
      const cloudConfig = config.get("cloud");
      if (cloudConfig.oss) {
        cloudConfig.oss.region = value;
        config.set("cloud", cloudConfig);
        logger.info(`已更新 region: ${value}`);
      }
    }
  }
}
```

---

### 配置文件管理

#### 配置文件位置

- **路径**: `~/.fast/config.json`
- **格式**: JSON
- **权限**: 用户可读写

#### 手动编辑配置

```bash
# 查看配置文件
cat ~/.fast/config.json

# 编辑配置文件
vim ~/.fast/config.json
```

**配置文件示例**:
```json
{
  "cloud": {
    "oss": {
      "region": "oss-cn-hangzhou",
      "apiKey": "LTAI5txxxxxxxxxx",
      "apiKeySecret": "xxxxxxxxxxxxxx",
      "bucket": "my-bucket",
      "domain": "https://cdn.example.com",
      "uploadRetries": 3
    }
  }
}
```

#### 配置备份

```typescript
export default class BackupCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("backup")
      .description("备份配置")
      .action(async () => {
        const fs = require("fs");
        const path = require("path");
        
        const configFile = path.join(
          require("os").homedir(),
          ".fast",
          "config.json"
        );
        
        const backupFile = configFile + ".backup";
        fs.copyFileSync(configFile, backupFile);
        
        console.log(`配置已备份到: ${backupFile}`);
      });
  }
}
```

---

## UploadService (上传服务)

UploadService 提供了文件上传到阿里云 OSS 的功能，支持自动重试和错误处理。

### 基本信息

- **服务名称**: `"upload"`
- **文件路径**: `src/core/services/upload/UploadService.ts`
- **依赖**: `logger`, `config`
- **外部依赖**: `ali-oss`

### 功能特性

- ✅ 文件上传到阿里云 OSS
- ✅ 自动重试机制（可配置）
- ✅ 指数退避重试策略
- ✅ 自定义域名支持
- ✅ 文件验证
- ✅ 进度日志

### 配置要求

在使用 UploadService 之前，必须先配置 OSS：

```typescript
{
  "cloud": {
    "oss": {
      "region": "oss-cn-hangzhou",      // 必需
      "apiKey": "your-api-key",         // 必需
      "apiKeySecret": "your-secret",    // 必需
      "bucket": "my-bucket",            // 必需
      "domain": "https://cdn.com",      // 可选：自定义域名
      "uploadRetries": 3                // 可选：重试次数，默认 3
    }
  }
}
```

### API 参考

#### `uploadFile(file: string, destName?: string): Promise<string>`

上传单个文件。

**参数**:
- `file: string` - 本地文件路径
- `destName?: string` - 目标文件名（可选，默认使用原文件名）

**返回**: `Promise<string>` - 文件的 URL

**抛出**:
- 文件不存在
- 文件不是普通文件
- 上传失败（所有重试后）

**示例**:
```typescript
const upload = this.requireService("upload");

// 使用原文件名上传
const url1 = await upload.uploadFile("/path/to/image.jpg");
console.log(url1); // https://bucket.oss-cn-hangzhou.aliyuncs.com/image.jpg

// 指定目标文件名
const url2 = await upload.uploadFile(
  "/path/to/image.jpg",
  "photos/2024/image.jpg"
);
console.log(url2); // https://bucket.oss-cn-hangzhou.aliyuncs.com/photos/2024/image.jpg

// 使用自定义域名
// 如果配置了 domain，返回的 URL 会使用自定义域名
// https://cdn.example.com/image.jpg
```

---

#### `uploadMultiple(files: string[], destNames?: string[]): Promise<string[]>`

批量上传文件。

**参数**:
- `files: string[]` - 本地文件路径数组
- `destNames?: string[]` - 目标文件名数组（可选）

**返回**: `Promise<string[]>` - 文件 URL 数组

**抛出**: 任何一个文件上传失败时抛出

**示例**:
```typescript
const upload = this.requireService("upload");

// 批量上传
const files = [
  "/path/to/image1.jpg",
  "/path/to/image2.jpg",
  "/path/to/image3.jpg",
];

const urls = await upload.uploadMultiple(files);
console.log(urls);
// [
//   "https://bucket.oss-cn-hangzhou.aliyuncs.com/image1.jpg",
//   "https://bucket.oss-cn-hangzhou.aliyuncs.com/image2.jpg",
//   "https://bucket.oss-cn-hangzhou.aliyuncs.com/image3.jpg",
// ]

// 指定目标文件名
const destNames = [
  "photos/2024/01/img1.jpg",
  "photos/2024/01/img2.jpg",
  "photos/2024/01/img3.jpg",
];

const urls2 = await upload.uploadMultiple(files, destNames);
```

---

### 使用示例

#### 基础上传命令

```typescript
import CommandBase from "@core/base/CommandBase";
import { Argument } from "commander";

export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .description("上传文件到云端")
      .addArgument(
        new Argument("<file>", "要上传的文件路径")
      )
      .option("-d, --dest <name>", "目标文件名")
      .action(async (file: string, options) => {
        await this.handleUpload(file, options);
      });
  }

  private async handleUpload(
    file: string,
    options: { dest?: string }
  ): Promise<void> {
    const logger = this.requireService("logger");
    const upload = this.requireService("upload");

    try {
      logger.info(`开始上传: ${file}`);

      const url = await upload.uploadFile(file, options.dest);

      logger.info("上传成功！");
      logger.info(`URL: ${url}`);
    } catch (error) {
      logger.error("上传失败:", error);
      process.exit(1);
    }
  }
}
```

#### 带进度的上传

```typescript
private async handleUpload(file: string): Promise<void> {
  const logger = this.requireService("logger");
  const upload = this.requireService("upload");

  try {
    const fileName = path.basename(file);
    logger.info(`正在上传 ${fileName}...`);

    // 显示文件大小
    const stats = await fs.promises.stat(file);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    logger.debug(`文件大小: ${sizeMB} MB`);

    const startTime = Date.now();
    const url = await upload.uploadFile(file);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.info(`✓ 上传完成 (${duration}s)`);
    logger.info(`URL: ${url}`);
  } catch (error) {
    logger.error("✗ 上传失败:", error);
    throw error;
  }
}
```

#### 批量上传

```typescript
export default class BatchUploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload-batch")
      .description("批量上传文件")
      .argument("<pattern>", "文件匹配模式（如 *.jpg）")
      .action(async (pattern: string) => {
        await this.handleBatchUpload(pattern);
      });
  }

  private async handleBatchUpload(pattern: string): Promise<void> {
    const logger = this.requireService("logger");
    const upload = this.requireService("upload");
    const glob = require("glob");

    // 查找匹配的文件
    const files = glob.sync(pattern);
    
    if (files.length === 0) {
      logger.warn(`没有找到匹配的文件: ${pattern}`);
      return;
    }

    logger.info(`找到 ${files.length} 个文件`);

    try {
      // 批量上传
      const urls = await upload.uploadMultiple(files);

      logger.info("全部上传成功！");
      urls.forEach((url, index) => {
        logger.info(`${index + 1}. ${url}`);
      });
    } catch (error) {
      logger.error("批量上传失败:", error);
      process.exit(1);
    }
  }
}
```

#### 上传目录

```typescript
private async uploadDirectory(dir: string): Promise<string[]> {
  const logger = this.requireService("logger");
  const upload = this.requireService("upload");
  const fs = require("fs");
  const path = require("path");

  // 递归获取所有文件
  const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
    const files = fs.readdirSync(dirPath);

    files.forEach((file: string) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  };

  const files = getAllFiles(dir);
  logger.info(`找到 ${files.length} 个文件`);

  // 构建目标路径（保持目录结构）
  const destNames = files.map(file => {
    return path.relative(process.cwd(), file);
  });

  // 批量上传
  const urls = await upload.uploadMultiple(files, destNames);
  
  logger.info(`上传完成: ${urls.length} 个文件`);
  return urls;
}
```

---

### 重试机制

UploadService 内置了智能重试机制：

#### 重试配置

```typescript
// 在配置中设置重试次数
config.set("cloud", {
  oss: {
    // ... 其他配置
    uploadRetries: 5, // 最多重试 5 次
  }
});
```

#### 重试策略

- **策略**: 指数退避 (Exponential Backoff)
- **公式**: `延迟 = 500ms × 2^(重试次数 - 1)`

**重试时间表**:
| 重试次数 | 延迟时间 |
|---------|---------|
| 1 | 立即 |
| 2 | 500ms |
| 3 | 1000ms |
| 4 | 2000ms |
| 5 | 4000ms |

#### 重试日志

```
[2024-01-01 10:00:00] DEBUG Uploading "file.jpg" as "file.jpg" (attempt 1/3)
[2024-01-01 10:00:05] DEBUG Upload attempt 1 failed: Network error
[2024-01-01 10:00:05] DEBUG Retrying in 500ms...
[2024-01-01 10:00:06] DEBUG Uploading "file.jpg" as "file.jpg" (attempt 2/3)
[2024-01-01 10:00:10] INFO Upload succeeded: https://...
```

---

### 错误处理

#### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `OSS configuration is required` | 未配置 OSS | 运行 `fast init` 配置 |
| `File not found` | 文件不存在 | 检查文件路径 |
| `Path is not a regular file` | 路径是目录 | 使用文件路径 |
| `Failed to upload after N attempts` | 网络问题 | 检查网络连接 |

#### 错误处理示例

```typescript
try {
  const url = await upload.uploadFile(file);
  logger.info("上传成功:", url);
} catch (error) {
  if (error.message.includes("not found")) {
    logger.error("文件不存在:", file);
  } else if (error.message.includes("configuration")) {
    logger.error("请先配置 OSS: fast init");
  } else if (error.message.includes("after")) {
    logger.error("网络问题，上传失败");
  } else {
    logger.error("未知错误:", error);
  }
  process.exit(1);
}
```

---

### 自定义域名

#### 配置自定义域名

```typescript
config.set("cloud", {
  oss: {
    region: "oss-cn-hangzhou",
    apiKey: "...",
    apiKeySecret: "...",
    bucket: "my-bucket",
    domain: "https://cdn.example.com", // 自定义域名
  }
});
```

#### URL 生成规则

| 配置 | 返回 URL |
|------|---------|
| 无 domain | `https://bucket.oss-cn-hangzhou.aliyuncs.com/file.jpg` |
| 有 domain | `https://cdn.example.com/file.jpg` |

---

## 总结

Fast CLI 提供了三个核心内置服务：

1. **LoggerService**: 专业的日志系统
   - 多级别日志
   - 彩色输出
   - 灵活配置

2. **ConfigService**: 持久化配置管理
   - 自动保存
   - 类型安全
   - 防抖优化

3. **UploadService**: 可靠的文件上传
   - 阿里云 OSS 支持
   - 智能重试
   - 批量上传

这三个服务相互协作，为 CLI 应用提供了完整的基础功能。