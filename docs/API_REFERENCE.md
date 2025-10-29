# API 参考文档

本文档提供 Fast CLI 框架的完整 API 参考。

## 目录

- [Kernel API](#kernel-api)
- [ServiceManager API](#servicemanager-api)
- [Service API](#service-api)
- [CommandBase API](#commandbase-api)
- [内置服务 API](#内置服务-api)
  - [LoggerService API](#loggerservice-api)
  - [ConfigService API](#configservice-api)
  - [UploadService API](#uploadservice-api)
- [类型定义](#类型定义)
- [常量定义](#常量定义)

---

## Kernel API

### 类签名

```typescript
class Kernel extends Command
```

继承自 Commander.js 的 `Command` 类，拥有所有 Commander 的方法。

### 构造函数

#### `constructor()`

创建 Kernel 实例。

**签名**:
```typescript
constructor()
```

**返回**: `Kernel`

**示例**:
```typescript
const kernel = new Kernel();
```

---

### 属性

#### `serviceManager`

服务管理器实例。

**类型**: `ServiceManager` (只读)

**示例**:
```typescript
const logger = kernel.serviceManager.require("logger");
```

---

### 方法

#### `boot()`

启动应用内核。

**签名**:
```typescript
async boot(): Promise<void>
```

**返回**: `Promise<void>`

**抛出**: 
- `Error` - 启动失败时

**示例**:
```typescript
await kernel.boot();
```

---

#### `registerCommand()`

注册 CLI 命令。

**签名**:
```typescript
registerCommand(commandClass: CommandConstructor): void
```

**参数**:
- `commandClass: CommandConstructor` - 命令类构造函数

**返回**: `void`

**示例**:
```typescript
kernel.registerCommand(UploadCommand);
```

---

## ServiceManager API

### 类签名

```typescript
class ServiceManager
```

### 构造函数

#### `constructor(kernel)`

创建 ServiceManager 实例。

**签名**:
```typescript
constructor(protected kernel: Kernel)
```

**参数**:
- `kernel: Kernel` - Kernel 实例

**注意**: 通常不需要手动创建，Kernel 会自动创建。

---

### 方法

#### `define()`

定义一个服务。

**签名**:
```typescript
define<K extends ServiceName, T extends ServiceConstructor>(
  name: K,
  ctor: T
): void
```

**泛型**:
- `K extends ServiceName` - 服务名称类型
- `T extends ServiceConstructor` - 服务构造函数类型

**参数**:
- `name: K` - 服务名称
- `ctor: T` - 服务构造函数

**返回**: `void`

**示例**:
```typescript
serviceManager.define("logger", LoggerService);
```

---

#### `defineMultiple()`

批量定义多个服务。

**签名**:
```typescript
defineMultiple<K extends ServiceName, T extends ServiceConstructor>(
  services: Record<K, T>
): void
```

**参数**:
- `services: Record<K, T>` - 服务定义对象

**返回**: `void`

**示例**:
```typescript
serviceManager.defineMultiple({
  logger: LoggerService,
  config: ConfigService,
});
```

---

#### `get()`

获取服务实例（可能为 undefined）。

**签名**:
```typescript
get<K extends ServiceName, T extends ServiceInstance>(
  name: K
): T | undefined
```

**泛型**:
- `K extends ServiceName` - 服务名称类型
- `T extends ServiceInstance` - 服务实例类型

**参数**:
- `name: K` - 服务名称

**返回**: `T | undefined` - 服务实例或 undefined

**示例**:
```typescript
const logger = serviceManager.get<"logger", LoggerService>("logger");
if (logger) {
  logger.info("Logger available");
}
```

---

#### `require()`

获取服务实例（不存在则抛出错误）。

**签名**:
```typescript
require<K extends ServiceName, T extends ServiceInstance>(
  name: K
): T
```

**参数**:
- `name: K` - 服务名称

**返回**: `T` - 服务实例

**抛出**:
- `Error` - 服务不存在时

**示例**:
```typescript
const logger = serviceManager.require<"logger", LoggerService>("logger");
logger.info("This will always work or throw");
```

---

#### `instantiate()`

实例化一个服务。

**签名**:
```typescript
instantiate<K extends ServiceName, T extends ServiceInstance>(
  name: K,
  Ctor: ServiceConstructor
): T
```

**参数**:
- `name: K` - 服务名称
- `Ctor: ServiceConstructor` - 服务构造函数

**返回**: `T` - 服务实例

**抛出**:
- `Error` - 实例化失败时
- `Error` - 检测到循环依赖时

**示例**:
```typescript
const logger = serviceManager.instantiate("logger", LoggerService);
```

---

#### `initAll()`

初始化所有服务。

**签名**:
```typescript
async initAll(): Promise<void>
```

**返回**: `Promise<void>`

**抛出**:
- `Error` - 任何服务初始化失败时

**示例**:
```typescript
await serviceManager.initAll();
```

---

#### `destroy()`

销毁指定服务。

**签名**:
```typescript
async destroy<K extends ServiceName>(name: K): Promise<void>
```

**参数**:
- `name: K` - 服务名称

**返回**: `Promise<void>`

**示例**:
```typescript
await serviceManager.destroy("database");
```

---

#### `destroyAll()`

销毁所有服务。

**签名**:
```typescript
async destroyAll(): Promise<void>
```

**返回**: `Promise<void>`

**示例**:
```typescript
await serviceManager.destroyAll();
```

---

#### `has()`

检查服务是否存在。

**签名**:
```typescript
has<K extends ServiceName>(name: K): boolean
```

**参数**:
- `name: K` - 服务名称

**返回**: `boolean`

**示例**:
```typescript
if (serviceManager.has("logger")) {
  // logger 存在
}
```

---

#### `getNames()`

获取所有服务名称。

**签名**:
```typescript
getNames(): string[]
```

**返回**: `string[]` - 服务名称数组

**示例**:
```typescript
const names = serviceManager.getNames();
console.log(names); // ["logger", "config", "upload"]
```

---

## Service API

### 类签名

```typescript
abstract class Service
```

所有服务的抽象基类。

### 构造函数

#### `constructor(context)`

创建服务实例。

**签名**:
```typescript
constructor(protected context: ServiceContext)
```

**参数**:
- `context: ServiceContext` - 服务上下文

---

### 属性

#### `context`

服务上下文对象。

**类型**: `ServiceContext` (受保护)

**访问**:
```typescript
const kernel = this.context.kernel;
```

---

### 方法

#### `getService()`

获取其他服务实例（可选）。

**签名**:
```typescript
protected getService<K extends ServiceName, T extends ServiceInstance<K>>(
  name: K
): T | undefined
```

**参数**:
- `name: K` - 服务名称

**返回**: `T | undefined`

**示例**:
```typescript
const logger = this.getService("logger");
```

---

#### `requireService()`

获取其他服务实例（必需）。

**签名**:
```typescript
protected requireService<K extends ServiceName, T extends ServiceInstance<K>>(
  name: K
): T
```

**参数**:
- `name: K` - 服务名称

**返回**: `T`

**抛出**:
- `Error` - 服务不存在时

**示例**:
```typescript
const logger = this.requireService("logger");
```

---

### 生命周期钩子

#### `onRegister()`

服务注册时调用（可选）。

**签名**:
```typescript
onRegister?(): void
```

**返回**: `void`

**调用时机**: 服务实例化后立即调用

**示例**:
```typescript
public onRegister(): void {
  this.logger = this.requireService("logger");
}
```

---

#### `onInit()`

服务初始化时调用（可选）。

**签名**:
```typescript
async onInit?(): Promise<void>
```

**返回**: `Promise<void>`

**调用时机**: 所有服务注册完成后调用

**示例**:
```typescript
public async onInit(): Promise<void> {
  await this.connect();
}
```

---

#### `onDestroy()`

服务销毁时调用（可选）。

**签名**:
```typescript
async onDestroy?(): Promise<void>
```

**返回**: `Promise<void>`

**调用时机**: 服务销毁时调用

**示例**:
```typescript
public async onDestroy(): Promise<void> {
  await this.disconnect();
}
```

---

## CommandBase API

### 类签名

```typescript
abstract class CommandBase
```

所有命令的抽象基类。

### 构造函数

#### `constructor(kernel)`

创建命令实例。

**签名**:
```typescript
constructor(protected kernel: Kernel)
```

**参数**:
- `kernel: Kernel` - Kernel 实例

---

### 属性

#### `program`

Commander.js 的 Command 实例。

**类型**: `Command` (只读)

**示例**:
```typescript
this.program.name("upload").description("上传文件");
```

---

#### `kernel`

Kernel 实例。

**类型**: `Kernel` (受保护)

**示例**:
```typescript
const serviceManager = this.kernel.serviceManager;
```

---

### 方法

#### `getService()`

获取服务实例（可选）。

**签名**:
```typescript
getService<K extends ServiceName>(
  name: K
): ServiceInstance<K> | undefined
```

**参数**:
- `name: K` - 服务名称

**返回**: `ServiceInstance<K> | undefined`

**示例**:
```typescript
const logger = this.getService("logger");
```

---

#### `requireService()`

获取服务实例（必需）。

**签名**:
```typescript
requireService<K extends ServiceName>(
  name: K
): ServiceInstance<K>
```

**参数**:
- `name: K` - 服务名称

**返回**: `ServiceInstance<K>`

**抛出**:
- `Error` - 服务不存在时

**示例**:
```typescript
const logger = this.requireService("logger");
```

---

### 生命周期钩子

#### `onEnable()` (必需)

命令启用时调用。

**签名**:
```typescript
abstract onEnable(): void
```

**返回**: `void`

**示例**:
```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .action(async () => {});
}
```

---

#### `onDisable()` (可选)

命令禁用时调用。

**签名**:
```typescript
onDisable?(): void
```

**返回**: `void`

---

#### `onError()` (可选)

命令出错时调用。

**签名**:
```typescript
onError?(error: Error): void
```

**参数**:
- `error: Error` - 错误对象

**返回**: `void`

---

## 内置服务 API

### LoggerService API

#### 类签名

```typescript
class LoggerService extends Service
```

#### 方法

##### `info()`

输出信息日志。

**签名**:
```typescript
info(...args: unknown[]): void
```

**参数**:
- `...args: unknown[]` - 要输出的内容

**返回**: `void`

**示例**:
```typescript
logger.info("应用启动");
logger.info("用户:", { id: 1, name: "Alice" });
```

---

##### `debug()`

输出调试日志。

**签名**:
```typescript
debug(...args: unknown[]): void
```

**参数**:
- `...args: unknown[]` - 要输出的内容

**返回**: `void`

**示例**:
```typescript
logger.debug("变量值:", data);
```

---

##### `warn()`

输出警告日志。

**签名**:
```typescript
warn(...args: unknown[]): void
```

**参数**:
- `...args: unknown[]` - 要输出的内容

**返回**: `void`

**示例**:
```typescript
logger.warn("配置项缺失");
```

---

##### `error()`

输出错误日志。

**签名**:
```typescript
error(...args: unknown[]): void
```

**参数**:
- `...args: unknown[]` - 要输出的内容

**返回**: `void`

**示例**:
```typescript
logger.error("操作失败:", error);
```

---

##### `setLevel()`

设置日志级别。

**签名**:
```typescript
setLevel(logLevel: LogLevelLiteral): void
```

**参数**:
- `logLevel: LogLevelLiteral` - 日志级别

**返回**: `void`

**示例**:
```typescript
logger.setLevel("debug");
```

---

##### `getLevel()`

获取当前日志级别。

**签名**:
```typescript
getLevel(): LogLevelLiteral
```

**返回**: `LogLevelLiteral` - 当前日志级别

**示例**:
```typescript
const level = logger.getLevel();
```

---

##### `setOutput()`

设置输出流。

**签名**:
```typescript
setOutput(output: typeof console.log): void
```

**参数**:
- `output: typeof console.log` - 输出函数

**返回**: `void`

**示例**:
```typescript
logger.setOutput((...args) => {
  // 自定义输出
});
```

---

### ConfigService API

#### 类签名

```typescript
class ConfigService extends Service
```

#### 方法

##### `get()`

获取配置值。

**签名**:
```typescript
get<K extends keyof IConfig>(key: K): IConfig[K]
```

**参数**:
- `key: K` - 配置键

**返回**: `IConfig[K]` - 配置值

**示例**:
```typescript
const cloud = config.get("cloud");
```

---

##### `set()`

设置配置值。

**签名**:
```typescript
set<K extends keyof IConfig>(key: K, value: IConfig[K]): void
```

**参数**:
- `key: K` - 配置键
- `value: IConfig[K]` - 配置值

**返回**: `void`

**示例**:
```typescript
config.set("cloud", { oss: { ... } });
```

---

##### `delete()`

删除配置项。

**签名**:
```typescript
delete<K extends keyof IConfig>(key: K): void
```

**参数**:
- `key: K` - 配置键

**返回**: `void`

**示例**:
```typescript
config.delete("cloud");
```

---

##### `has()`

检查配置项是否存在。

**签名**:
```typescript
has<K extends keyof IConfig>(key: K): boolean
```

**参数**:
- `key: K` - 配置键

**返回**: `boolean`

**示例**:
```typescript
if (config.has("cloud")) {
  // 配置存在
}
```

---

##### `save()`

立即保存配置。

**签名**:
```typescript
save(): void
```

**返回**: `void`

**抛出**:
- `Error` - 保存失败时

**示例**:
```typescript
config.save();
```

---

##### `flush()`

刷新配置（取消防抖并立即保存）。

**签名**:
```typescript
flush(): void
```

**返回**: `void`

**示例**:
```typescript
config.flush();
```

---

##### `loadConfig()`

重新加载配置文件。

**签名**:
```typescript
loadConfig(): void
```

**返回**: `void`

**抛出**:
- `Error` - 加载失败时

**示例**:
```typescript
config.loadConfig();
```

---

### UploadService API

#### 类签名

```typescript
class UploadService extends Service
```

#### 方法

##### `uploadFile()`

上传单个文件。

**签名**:
```typescript
async uploadFile(file: string, destName?: string): Promise<string>
```

**参数**:
- `file: string` - 本地文件路径
- `destName?: string` - 目标文件名（可选）

**返回**: `Promise<string>` - 文件 URL

**抛出**:
- `Error` - 文件不存在
- `Error` - 文件不是普通文件
- `Error` - 上传失败

**示例**:
```typescript
const url = await upload.uploadFile("/path/to/file.jpg");
const url2 = await upload.uploadFile("/path/to/file.jpg", "dest.jpg");
```

---

##### `uploadMultiple()`

批量上传文件。

**签名**:
```typescript
async uploadMultiple(
  files: string[],
  destNames?: string[]
): Promise<string[]>
```

**参数**:
- `files: string[]` - 本地文件路径数组
- `destNames?: string[]` - 目标文件名数组（可选）

**返回**: `Promise<string[]>` - 文件 URL 数组

**抛出**:
- `Error` - 任何文件上传失败

**示例**:
```typescript
const urls = await upload.uploadMultiple([
  "/path/to/file1.jpg",
  "/path/to/file2.jpg",
]);
```

---

## 类型定义

### ServiceName

所有服务名称的联合类型。

**定义**:
```typescript
type ServiceName = "logger" | "config" | "upload";
```

**用途**: 约束服务名称

---

### ServiceInstance

服务实例类型映射。

**定义**:
```typescript
type ServiceInstance<K extends ServiceName = ServiceName> = ServiceRegistry[K];
```

**示例**:
```typescript
type LoggerInstance = ServiceInstance<"logger">; // LoggerService
```

---

### ServiceRegistry

服务注册表类型。

**定义**:
```typescript
type ServiceRegistry = {
  [K in keyof typeof serviceDefinitions]: InstanceType<
    (typeof serviceDefinitions)[K]
  >;
};
```

**示例**:
```typescript
type Registry = ServiceRegistry;
// {
//   logger: LoggerService;
//   config: ConfigService;
//   upload: UploadService;
// }
```

---

### ServiceConstructor

服务构造函数类型。

**定义**:
```typescript
type ServiceConstructor = (typeof serviceDefinitions)[ServiceName];
```

---

### ServiceContext

服务上下文接口。

**定义**:
```typescript
interface ServiceContext {
  kernel: Kernel;
  getService<K extends ServiceName, T extends ServiceInstance<K>>(
    name: K
  ): T | undefined;
  requireService<K extends ServiceName, T extends ServiceInstance<K>>(
    name: K
  ): T;
}
```

---

### CommandConstructor

命令构造函数接口。

**定义**:
```typescript
interface CommandConstructor {
  new (kernel: Kernel): CommandBase;
}
```

---

### LogLevelLiteral

日志级别字面量类型。

**定义**:
```typescript
type LogLevelLiteral = "debug" | "info" | "warn" | "error" | "silent";
```

---

### IConfig

配置接口。

**定义**:
```typescript
interface IConfig {
  cloud: CloudConfig;
}

type CloudConfig = {
  oss?: OSSCloudConfig;
};

interface OSSCloudConfig extends Partial<BaseCloudConfig> {
  region: string;
  apiKey: string;
  apiKeySecret: string;
  bucket: string;
  domain?: string;
}

interface BaseCloudConfig {
  uploadRetries: number;
}
```

---

## 常量定义

### APP_NAME

应用名称。

**类型**: `string`

**值**: `"fast"`

**位置**: `src/core/constants.ts`

---

### APP_DIR

应用目录。

**类型**: `string`

**值**: `~/.fast`

**位置**: `src/core/constants.ts`

---

### CONFIG.DIR

配置目录。

**类型**: `string`

**值**: `~/.fast`

**位置**: `src/core/constants.ts`

---

### CONFIG.FILE

配置文件路径。

**类型**: `string`

**值**: `~/.fast/config.json`

**位置**: `src/core/constants.ts`

---

### CONFIG.DEBOUNCE_DELAY

配置保存防抖延迟（毫秒）。

**类型**: `number`

**值**: `100`

**位置**: `src/core/constants.ts`

---

### LOGGER.DEFAULT_LEVEL

默认日志级别。

**类型**: `string`

**值**: `"info"`

**位置**: `src/core/constants.ts`

---

### LOGGER.DATE_FORMAT

日志日期格式。

**类型**: `string`

**值**: `"YYYY-MM-DD HH:mm:ss"`

**位置**: `src/core/constants.ts`

---

## 使用示例

### 完整的服务实现

```typescript
import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";
import ConfigService from "../config/ConfigService";

export default class MyService extends Service {
  private logger!: LoggerService;
  private config!: ConfigService;
  private data: any[] = [];

  // 1. 注册时获取依赖
  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");
  }

  // 2. 初始化时执行异步操作
  public async onInit(): Promise<void> {
    await this.loadData();
    this.logger.info("MyService initialized");
  }

  // 3. 销毁时清理资源
  public async onDestroy(): Promise<void> {
    await this.saveData();
    this.logger.info("MyService destroyed");
  }

  // 业务方法
  private async loadData(): Promise<void> {
    this.data = [];
  }

  private async saveData(): Promise<void> {
    // 保存数据
  }

  public getData(): any[] {
    return this.data;
  }
}
```

### 完整的命令实现

```typescript
import CommandBase from "@core/base/CommandBase";
import { Argument, Option } from "commander";

export default class MyCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("my-command")
      .description("我的命令")
      .addArgument(new Argument("<input>", "输入参数"))
      .addOption(new Option("-v, --verbose", "详细输出"))
      .action(async (input: string, options) => {
        await this.execute(input, options);
      });
  }

  private async execute(
    input: string,
    options: { verbose?: boolean }
  ): Promise<void> {
    const logger = this.requireService("logger");
    const myService = this.requireService("myService");

    if (options.verbose) {
      logger.setLevel("debug");
    }

    try {
      logger.info("执行命令:", input);
      const data = myService.getData();
      logger.info("数据:", data);
    } catch (error) {
      logger.error("命令执行失败:", error);
      process.exit(1);
    }
  }

  public onError(error: Error): void {
    const logger = this.getService("logger");
    if (logger) {
      logger.error("错误:", error);
    }
  }
}
```

---

## 版本信息

- **API 版本**: 1.0.0
- **最后更新**: 2024-01-01
- **兼容性**: TypeScript >= 5.0.0, Node.js >= 18.0.0

---

## 相关文档

- [架构概述](./ARCHITECTURE.md)
- [快速开始](./GETTING_STARTED.md)
- [核心组件](./CORE_COMPONENTS.md)
- [内置服务](./BUILT_IN_SERVICES.md)
- [最佳实践](./BEST_PRACTICES.md)

---

## 📖 文档导航

**上一篇：** [最佳实践](./BEST_PRACTICES.md)