# 核心组件详解

本文档详细介绍 Fast CLI 框架的所有核心组件。

## 目录

- [Kernel (内核)](#kernel-内核)
- [ServiceManager (服务管理器)](#servicemanager-服务管理器)
- [Service (服务基类)](#service-服务基类)
- [CommandBase (命令基类)](#commandbase-命令基类)
- [ServiceContext (服务上下文)](#servicecontext-服务上下文)
- [类型系统](#类型系统)

---

## Kernel (内核)

Kernel 是应用的核心，继承自 Commander.js 的 `Command` 类，负责应用的启动、服务管理和命令注册。

### 类定义

```typescript
export default class Kernel extends Command {
  public readonly serviceManager!: ServiceManager;
  
  constructor();
  public async boot(): Promise<void>;
  public registerCommand(commandClass: CommandConstructor): void;
}
```

### 属性

#### `serviceManager: ServiceManager`

服务管理器实例，用于管理所有服务的生命周期。

**类型**: `ServiceManager` (只读)

**示例**:
```typescript
const kernel = new Kernel();
const logger = kernel.serviceManager.require("logger");
```

### 方法

#### `constructor()`

创建 Kernel 实例。

**示例**:
```typescript
const kernel = new Kernel();
```

**说明**:
- 初始化 ServiceManager
- 继承 Commander.js 的所有功能

---

#### `boot(): Promise<void>`

启动应用内核，初始化所有服务。

**返回**: `Promise<void>`

**抛出**: 
- 启动失败时抛出 Error

**执行流程**:
1. 调用 `serviceManager.defineMultiple()` 注册所有服务定义
2. 调用 `serviceManager.initAll()` 初始化所有服务
3. 标记为已启动状态

**示例**:
```typescript
const kernel = new Kernel();
await kernel.boot();
```

**最佳实践**:
```typescript
async function main() {
  const kernel = new Kernel();
  
  try {
    await kernel.boot();
  } catch (error) {
    console.error("启动失败:", error);
    process.exit(1);
  }
  
  // 启动成功，继续注册命令
  kernel.registerCommand(MyCommand);
}
```

---

#### `registerCommand(commandClass: CommandConstructor): void`

注册 CLI 命令。

**参数**:
- `commandClass: CommandConstructor` - 命令类（必须继承 CommandBase）

**返回**: `void`

**示例**:
```typescript
import UploadCommand from "./commands/UploadCommand";

kernel.registerCommand(UploadCommand);
```

**批量注册**:
```typescript
const commands = [
  UploadCommand,
  ConfigCommand,
  QueryCommand,
];

commands.forEach(cmd => kernel.registerCommand(cmd));
```

---

### 完整使用示例

```typescript
import Kernel from "@core/Kernel";
import UploadCommand from "./commands/UploadCommand";
import ConfigCommand from "./commands/ConfigCommand";

async function main() {
  // 1. 创建内核
  const kernel = new Kernel();
  
  // 2. 配置全局选项（继承自 Commander）
  kernel
    .name("fast")
    .description("Fast CLI Tool")
    .version("1.0.0");
  
  // 3. 启动内核
  await kernel.boot();
  
  // 4. 注册命令
  kernel.registerCommand(UploadCommand);
  kernel.registerCommand(ConfigCommand);
  
  // 5. 解析命令行参数
  await kernel.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("应用错误:", error);
  process.exit(1);
});
```

---

## ServiceManager (服务管理器)

ServiceManager 负责服务的注册、实例化、依赖注入和生命周期管理。

### 类定义

```typescript
export default class ServiceManager {
  constructor(protected kernel: Kernel);
  
  // 服务定义
  public define<K extends ServiceName>(name: K, ctor: ServiceConstructor): void;
  public defineMultiple(services: Record<ServiceName, ServiceConstructor>): void;
  
  // 服务获取
  public get<K extends ServiceName>(name: K): ServiceInstance<K> | undefined;
  public require<K extends ServiceName>(name: K): ServiceInstance<K>;
  
  // 服务实例化
  public instantiate<K extends ServiceName>(name: K, Ctor: ServiceConstructor): ServiceInstance<K>;
  
  // 生命周期管理
  public async initAll(): Promise<void>;
  public destroy(name: ServiceName): void;
  public async destroyAll(): Promise<void>;
  
  // 工具方法
  public has(name: ServiceName): boolean;
  public getNames(): string[];
}
```

### 核心概念

#### 服务生命周期

```
定义 (define) 
    ↓
实例化 (instantiate)
    ↓
注册 (onRegister)
    ↓
初始化 (onInit)
    ↓
运行中
    ↓
销毁 (onDestroy)
```

#### 单例模式

每个服务只会被实例化一次，多次调用 `get()` 返回同一个实例。

```typescript
const logger1 = serviceManager.get("logger");
const logger2 = serviceManager.get("logger");

console.log(logger1 === logger2); // true
```

### 方法详解

#### `define(name, ctor): void`

定义一个服务（不立即实例化）。

**参数**:
- `name: ServiceName` - 服务名称
- `ctor: ServiceConstructor` - 服务构造函数

**示例**:
```typescript
serviceManager.define("logger", LoggerService);
serviceManager.define("config", ConfigService);
```

---

#### `defineMultiple(services): void`

批量定义多个服务。

**参数**:
- `services: Record<ServiceName, ServiceConstructor>` - 服务定义对象

**示例**:
```typescript
import { serviceDefinitions } from "./services/registry";

serviceManager.defineMultiple(serviceDefinitions);
```

---

#### `get(name): ServiceInstance | undefined`

获取服务实例（可能为 undefined）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `ServiceInstance<K> | undefined`

**行为**:
- 如果服务已实例化，直接返回
- 如果服务已定义但未实例化，立即实例化并返回
- 如果服务未定义，返回 `undefined`

**示例**:
```typescript
const logger = serviceManager.get("logger");
if (logger) {
  logger.info("Logger is available");
} else {
  console.error("Logger not found");
}
```

---

#### `require(name): ServiceInstance`

获取服务实例（不存在则抛出错误）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `ServiceInstance<K>`

**抛出**: 
- 服务不存在时抛出 Error

**示例**:
```typescript
const logger = serviceManager.require("logger");
logger.info("This will always work or throw");
```

**使用场景**:
- 当服务是必需的时候使用 `require()`
- 当服务是可选的时候使用 `get()`

---

#### `instantiate(name, Ctor): ServiceInstance`

实例化一个服务。

**参数**:
- `name: ServiceName` - 服务名称
- `Ctor: ServiceConstructor` - 服务构造函数

**返回**: `ServiceInstance<K>`

**执行流程**:
1. 检查是否已实例化（避免重复）
2. 创建 ServiceContext
3. 调用构造函数
4. 缓存实例
5. 调用 `onRegister()` 钩子
6. 返回实例

**示例**:
```typescript
const logger = serviceManager.instantiate("logger", LoggerService);
```

**注意**: 通常不需要直接调用此方法，使用 `get()` 或 `require()` 即可。

---

#### `initAll(): Promise<void>`

初始化所有已定义的服务。

**返回**: `Promise<void>`

**执行流程**:
1. 实例化所有已定义的服务
2. 依次调用每个服务的 `onInit()` 方法
3. 标记为已初始化

**示例**:
```typescript
await serviceManager.initAll();
```

**错误处理**:
```typescript
try {
  await serviceManager.initAll();
} catch (error) {
  console.error("服务初始化失败:", error);
  process.exit(1);
}
```

---

#### `destroy(name): void`

销毁指定服务。

**参数**:
- `name: ServiceName` - 服务名称

**执行流程**:
1. 调用服务的 `onDestroy()` 方法
2. 从缓存中移除

**示例**:
```typescript
serviceManager.destroy("database");
```

---

#### `destroyAll(): Promise<void>`

销毁所有服务。

**返回**: `Promise<void>`

**示例**:
```typescript
process.on("SIGINT", async () => {
  await serviceManager.destroyAll();
  process.exit(0);
});
```

---

#### `has(name): boolean`

检查服务是否存在（已定义或已实例化）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `boolean`

**示例**:
```typescript
if (serviceManager.has("logger")) {
  const logger = serviceManager.get("logger");
}
```

---

#### `getNames(): string[]`

获取所有服务名称。

**返回**: `string[]`

**示例**:
```typescript
const names = serviceManager.getNames();
console.log("已注册的服务:", names);
// 输出: ["logger", "config", "upload"]
```

---

## Service (服务基类)

Service 是所有服务的抽象基类，提供了生命周期钩子和依赖注入方法。

### 类定义

```typescript
export default abstract class Service {
  constructor(protected context: ServiceContext);
  
  // 依赖注入方法
  protected getService<K extends ServiceName>(name: K): ServiceInstance<K> | undefined;
  protected requireService<K extends ServiceName>(name: K): ServiceInstance<K>;
  
  // 生命周期钩子（可选实现）
  public onRegister?(): void;
  public async onInit?(): Promise<void>;
  public async onDestroy?(): Promise<void>;
}
```

### 属性

#### `context: ServiceContext`

服务上下文，提供访问 Kernel 和其他服务的能力。

**类型**: `ServiceContext` (受保护)

**访问**:
```typescript
const kernel = this.context.kernel;
const logger = this.context.requireService("logger");
```

### 方法

#### `getService(name): ServiceInstance | undefined`

获取其他服务实例（可选）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `ServiceInstance<K> | undefined`

**示例**:
```typescript
export default class MyService extends Service {
  public doSomething(): void {
    const logger = this.getService("logger");
    if (logger) {
      logger.info("Doing something");
    }
  }
}
```

---

#### `requireService(name): ServiceInstance`

获取其他服务实例（必需）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `ServiceInstance<K>`

**抛出**: 
- 服务不存在时抛出 Error

**示例**:
```typescript
export default class MyService extends Service {
  private logger!: LoggerService;
  
  public onRegister(): void {
    this.logger = this.requireService("logger");
  }
}
```

---

### 生命周期钩子

#### `onRegister?(): void`

服务注册时调用（同步）。

**调用时机**: 服务实例化后立即调用

**用途**:
- 获取依赖服务
- 快速的同步初始化
- 注册事件监听器

**示例**:
```typescript
public onRegister(): void {
  // ✅ 获取依赖
  this.logger = this.requireService("logger");
  this.config = this.requireService("config");
  
  // ✅ 简单的同步初始化
  this.data = [];
  
  // ❌ 不要进行异步操作
  // await this.connect(); // 错误！
}
```

---

#### `onInit?(): Promise<void>`

所有服务注册完成后调用（异步）。

**调用时机**: `serviceManager.initAll()` 时

**用途**:
- 异步初始化（数据库连接、文件读取等）
- 依赖其他服务的初始化结果
- 资源准备

**示例**:
```typescript
public async onInit(): Promise<void> {
  // ✅ 异步操作
  await this.connect();
  await this.loadData();
  
  // ✅ 使用已初始化的服务
  const config = this.requireService("config");
  this.apiKey = config.get("apiKey");
  
  this.logger.info("Service initialized");
}
```

---

#### `onDestroy?(): Promise<void>`

服务销毁时调用（异步）。

**调用时机**: 
- `serviceManager.destroy(name)` 时
- `serviceManager.destroyAll()` 时
- 应用退出时

**用途**:
- 清理资源
- 关闭连接
- 保存状态

**示例**:
```typescript
public async onDestroy(): Promise<void> {
  // ✅ 清理资源
  await this.disconnect();
  
  // ✅ 保存状态
  await this.saveState();
  
  // ✅ 移除事件监听
  process.off("exit", this.exitHandler);
  
  this.logger.info("Service destroyed");
}
```

---

### 完整服务示例

```typescript
import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";
import ConfigService from "../config/ConfigService";

export default class DatabaseService extends Service {
  private logger!: LoggerService;
  private config!: ConfigService;
  private connection: any = null;
  private connected = false;

  // 1. 注册阶段 - 获取依赖
  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");
    this.logger.debug("DatabaseService registered");
  }

  // 2. 初始化阶段 - 异步初始化
  public async onInit(): Promise<void> {
    const dbUrl = this.config.get("database.url");
    if (!dbUrl) {
      throw new Error("Database URL not configured");
    }

    try {
      await this.connect(dbUrl);
      this.logger.info("Database initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize database:", error);
      throw error;
    }
  }

  // 3. 销毁阶段 - 清理资源
  public async onDestroy(): Promise<void> {
    if (this.connected) {
      await this.disconnect();
      this.logger.info("Database connection closed");
    }
  }

  // 业务方法
  private async connect(url: string): Promise<void> {
    this.logger.debug(`Connecting to database: ${url}`);
    // 实际连接逻辑
    this.connection = {}; // 模拟连接
    this.connected = true;
  }

  private async disconnect(): Promise<void> {
    this.logger.debug("Disconnecting from database");
    // 实际断开逻辑
    this.connection = null;
    this.connected = false;
  }

  public async query(sql: string): Promise<any[]> {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    this.logger.debug(`Executing query: ${sql}`);
    // 实际查询逻辑
    return [];
  }
}
```

---

## CommandBase (命令基类)

CommandBase 是所有 CLI 命令的抽象基类，提供了访问服务的便捷方法。

### 类定义

```typescript
export default abstract class CommandBase {
  public readonly program: Command;
  
  constructor(protected kernel: Kernel);
  
  // 服务访问
  public getService<K extends ServiceName>(name: K): ServiceInstance<K> | undefined;
  public requireService<K extends ServiceName>(name: K): ServiceInstance<K>;
  
  // 生命周期
  abstract onEnable(): void;
  public onDisable?(): void;
  public onError?(error: Error): void;
}
```

### 属性

#### `program: Command`

Commander.js 的 Command 实例。

**类型**: `Command` (只读)

**用途**: 定义命令的名称、描述、选项和动作

**示例**:
```typescript
this.program
  .name("upload")
  .description("上传文件到云端")
  .action(async () => { });
```

---

#### `kernel: Kernel`

Kernel 实例的引用。

**类型**: `Kernel` (受保护)

**用途**: 访问服务管理器或其他 Kernel 功能

**示例**:
```typescript
const serviceManager = this.kernel.serviceManager;
```

---

### 方法

#### `getService(name): ServiceInstance | undefined`

获取服务实例（可选）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `ServiceInstance<K> | undefined`

**示例**:
```typescript
const logger = this.getService("logger");
if (logger) {
  logger.info("Logger available");
}
```

---

#### `requireService(name): ServiceInstance`

获取服务实例（必需）。

**参数**:
- `name: ServiceName` - 服务名称

**返回**: `ServiceInstance<K>`

**抛出**: 
- 服务不存在时抛出 Error

**示例**:
```typescript
const logger = this.requireService("logger");
const upload = this.requireService("upload");
```

---

### 生命周期钩子

#### `onEnable(): void` (必需)

命令启用时调用，用于配置命令。

**调用时机**: 命令实例化时

**用途**: 定义命令的所有配置

**示例**:
```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .description("上传文件到云端")
    .argument("<file>", "要上传的文件路径")
    .option("-d, --dest <name>", "目标文件名")
    .action(async (file: string, options) => {
      await this.handleUpload(file, options);
    });
}
```

---

#### `onDisable?(): void` (可选)

命令禁用时调用。

**用途**: 清理资源、移除监听器

**示例**:
```typescript
public onDisable(): void {
  // 清理工作
}
```

---

#### `onError?(error: Error): void` (可选)

命令执行出错时调用。

**参数**:
- `error: Error` - 错误对象

**用途**: 自定义错误处理

**示例**:
```typescript
public onError(error: Error): void {
  const logger = this.requireService("logger");
  logger.error("命令执行失败:", error);
  process.exit(1);
}
```

---

### 完整命令示例

```typescript
import CommandBase from "@core/base/CommandBase";
import { Argument, Option } from "commander";

export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .description("上传文件到云端")
      .addArgument(
        new Argument("<file>", "要上传的文件路径")
      )
      .addOption(
        new Option("-d, --dest <name>", "目标文件名")
      )
      .addOption(
        new Option("-v, --verbose", "显示详细信息")
          .default(false)
      )
      .action(async (file: string, options) => {
        await this.handleUpload(file, options);
      });
  }

  private async handleUpload(
    file: string,
    options: { dest?: string; verbose: boolean }
  ): Promise<void> {
    const logger = this.requireService("logger");
    const upload = this.requireService("upload");

    try {
      if (options.verbose) {
        logger.setLevel("debug");
      }

      logger.info(`正在上传文件: ${file}`);
      
      const url = await upload.uploadFile(file, options.dest);
      
      logger.info(`上传成功: ${url}`);
    } catch (error) {
      logger.error("上传失败:", error);
      process.exit(1);
    }
  }

  public onError(error: Error): void {
    const logger = this.getService("logger");
    if (logger) {
      logger.error("命令执行出错:", error);
    } else {
      console.error("命令执行出错:", error);
    }
  }
}
```

---

## ServiceContext (服务上下文)

ServiceContext 是传递给服务的上下文对象，提供访问 Kernel 和其他服务的能力。

### 接口定义

```typescript
export interface ServiceContext {
  kernel: Kernel;
  getService<K extends ServiceName>(name: K): ServiceInstance<K> | undefined;
  requireService<K extends ServiceName>(name: K): ServiceInstance<K>;
}
```

### 属性

#### `kernel: Kernel`

Kernel 实例的引用。

**用途**: 访问 ServiceManager 或其他 Kernel 功能

**示例**:
```typescript
constructor(protected context: ServiceContext) {
  const version = this.context.kernel.version();
}
```

---

### 方法

#### `getService(name): ServiceInstance | undefined`

获取服务实例（可选）。

---

#### `requireService(name): ServiceInstance`

获取服务实例（必需）。

---

## 类型系统

Fast CLI 提供了完整的类型系统，确保类型安全。

### ServiceName

所有服务名称的联合类型。

```typescript
type ServiceName = "logger" | "config" | "upload";
```

**用途**: 约束服务名称，提供自动补全

---

### ServiceInstance

服务实例类型映射。

```typescript
type ServiceInstance<K extends ServiceName> = ServiceRegistry[K];

// 示例
type LoggerInstance = ServiceInstance<"logger">; // LoggerService
```

---

### ServiceRegistry

服务注册表类型。

```typescript
export type ServiceRegistry = {
  logger: LoggerService;
  config: ConfigService;
  upload: UploadService;
};
```

**用途**: 
- 提供类型推断
- 自动补全服务名称
- 编译时类型检查

---

### ServiceConstructor

服务构造函数类型。

```typescript
export type ServiceConstructor = new (context: ServiceContext) => Service;
```

---

### CommandConstructor

命令构造函数类型。

```typescript
export interface CommandConstructor {
  new (kernel: Kernel): CommandBase;
}
```

---

## 类型安全示例

```typescript
// ✅ 类型安全：自动推断服务类型
const logger = this.requireService("logger"); // LoggerService
logger.info("Hello"); // ✅ OK

// ✅ 类型检查：服务名称必须存在
const unknown = this.requireService("unknown"); // ❌ 编译错误

// ✅ 类型推断：返回值类型自动推断
const config = this.requireService("config"); // ConfigService
const value = config.get("key"); // 类型为 any

// ✅ IDE 自动补全
this.requireService("l"); // 自动提示 "logger"
```

---

## 总结

Fast CLI 的核心组件设计遵循以下原则：

1. **清晰的职责分离**: 每个组件都有明确的职责
2. **类型安全**: 完整的 TypeScript 类型支持
3. **依赖注入**: 松耦合的依赖管理
4. **生命周期管理**: 明确的初始化和销毁流程
5. **易于扩展**: 通过继承和注册即可扩展功能

通过理解这些核心组件，你可以充分利用 Fast CLI 框架的能力，构建强大而灵活的 CLI 应用。