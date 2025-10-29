# 快速开始

本指南将帮助你在 5 分钟内快速上手 Fast CLI 核心架构。

## 目录

- [前置要求](#前置要求)
- [基础概念](#基础概念)
- [创建第一个应用](#创建第一个应用)
- [创建第一个服务](#创建第一个服务)
- [创建第一个命令](#创建第一个命令)
- [运行应用](#运行应用)
- [下一步](#下一步)

---

## 前置要求

- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- 基础的 TypeScript 和 Node.js 知识

---

## 基础概念

在开始之前，了解以下核心概念：

### Kernel (内核)
应用的入口和核心，负责启动服务和注册命令。

### Service (服务)
可重用的功能模块，如日志、配置、文件上传等。服务是单例的。

### Command (命令)
具体的 CLI 命令实现，可以使用服务来完成任务。

### ServiceManager (服务管理器)
管理所有服务的生命周期，提供依赖注入功能。

---

## 创建第一个应用

### 1. 创建入口文件

```typescript
// src/index.ts
import Kernel from "@core/Kernel";
import UploadCommand from "./commands/UploadCommand";

async function main() {
  const kernel = new Kernel();

  // 启动内核（会自动初始化所有服务）
  await kernel.boot();

  // 注册命令
  kernel.registerCommand(UploadCommand);

  // 解析命令行参数
  await kernel.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("应用启动失败:", error);
  process.exit(1);
});
```

就这么简单！现在你已经有了一个可运行的 CLI 应用。

---

## 创建第一个服务

服务是应用的核心功能模块。让我们创建一个简单的数据库服务。

### 1. 创建服务文件

```typescript
// src/core/services/database/DatabaseService.ts
import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";

export default class DatabaseService extends Service {
  private logger!: LoggerService;
  private connected = false;

  // 注册时调用（同步）
  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.logger.debug("DatabaseService registered");
  }

  // 初始化时调用（异步）
  public async onInit(): Promise<void> {
    await this.connect();
  }

  // 销毁时调用（异步）
  public async onDestroy(): Promise<void> {
    await this.disconnect();
  }

  // 业务方法
  private async connect(): Promise<void> {
    this.logger.info("Connecting to database...");
    // 模拟连接数据库
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    this.logger.info("Database connected");
  }

  private async disconnect(): Promise<void> {
    this.logger.info("Disconnecting from database...");
    this.connected = false;
  }

  public async query(sql: string): Promise<any[]> {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    this.logger.debug(`Executing query: ${sql}`);
    // 模拟查询
    return [];
  }
}
```

### 2. 注册服务

```typescript
// src/core/services/registry.ts
import ConfigService from "./config/ConfigService";
import LoggerService from "./logger/LoggerService";
import UploadService from "./upload/UploadService";
import DatabaseService from "./database/DatabaseService"; // 新增

export const serviceDefinitions = {
  logger: LoggerService,
  config: ConfigService,
  upload: UploadService,
  database: DatabaseService, // 新增
} as const;

export type ServiceRegistry = {
  [K in keyof typeof serviceDefinitions]: InstanceType<
    (typeof serviceDefinitions)[K]
  >;
};

export type ServiceName = keyof typeof serviceDefinitions;
export type ServiceConstructor = (typeof serviceDefinitions)[ServiceName];
```

### 3. 在其他服务中使用

```typescript
// 在其他服务中使用 DatabaseService
export default class UserService extends Service {
  private db!: DatabaseService;

  public onRegister(): void {
    this.db = this.requireService("database");
  }

  public async getUsers(): Promise<any[]> {
    return await this.db.query("SELECT * FROM users");
  }
}
```

---

## 创建第一个命令

命令是用户与应用交互的入口。让我们创建一个查询命令。

### 1. 创建命令文件

```typescript
// src/commands/QueryCommand.ts
import CommandBase from "@core/base/CommandBase";
import { Argument, Option } from "commander";

export default class QueryCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("query")
      .description("执行数据库查询")
      .addArgument(
        new Argument("<sql>", "SQL 查询语句")
      )
      .addOption(
        new Option("-f, --format <format>", "输出格式")
          .choices(["json", "table"])
          .default("table")
      )
      .action(async (sql: string, options) => {
        await this.executeQuery(sql, options);
      });
  }

  private async executeQuery(
    sql: string,
    options: { format: string }
  ): Promise<void> {
    const logger = this.requireService("logger");
    const db = this.requireService("database");

    try {
      logger.info(`执行查询: ${sql}`);

      const results = await db.query(sql);

      if (options.format === "json") {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.table(results);
      }

      logger.info(`查询完成，返回 ${results.length} 条记录`);
    } catch (error) {
      logger.error("查询失败:", error);
      process.exit(1);
    }
  }
}
```

### 2. 注册命令

```typescript
// src/index.ts
import Kernel from "@core/Kernel";
import QueryCommand from "./commands/QueryCommand";

async function main() {
  const kernel = new Kernel();
  await kernel.boot();

  // 注册命令
  kernel.registerCommand(QueryCommand);

  await kernel.parseAsync(process.argv);
}

main().catch(console.error);
```

---

## 运行应用

### 开发模式

```bash
# 使用 ts-node 直接运行
npx ts-node src/index.ts query "SELECT * FROM users"

# 或者使用 tsx
npx tsx src/index.ts query "SELECT * FROM users"
```

### 构建和运行

```bash
# 构建
npm run build

# 运行
node dist/index.js query "SELECT * FROM users"
```

### 查看帮助

```bash
node dist/index.js --help
node dist/index.js query --help
```

---

## 完整示例

这是一个完整的小例子，展示了所有核心功能：

```typescript
// src/core/services/greeting/GreetingService.ts
import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";
import ConfigService from "../config/ConfigService";

export default class GreetingService extends Service {
  private logger!: LoggerService;
  private config!: ConfigService;
  private greeting!: string;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");
  }

  public async onInit(): Promise<void> {
    // 从配置中读取问候语，如果没有则使用默认值
    this.greeting = this.config.get("greeting") || "Hello";
    this.logger.debug(`Greeting initialized: ${this.greeting}`);
  }

  public greet(name: string): string {
    return `${this.greeting}, ${name}!`;
  }

  public setGreeting(greeting: string): void {
    this.greeting = greeting;
    this.config.set("greeting", greeting);
    this.logger.info(`Greeting updated to: ${greeting}`);
  }
}
```

```typescript
// src/commands/GreetCommand.ts
import CommandBase from "@core/base/CommandBase";
import { Argument } from "commander";

export default class GreetCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("greet")
      .description("向某人问候")
      .addArgument(new Argument("<name>", "要问候的人的名字"))
      .action(async (name: string) => {
        const greeting = this.requireService("greeting");
        const logger = this.requireService("logger");

        const message = greeting.greet(name);
        logger.info(message);
      });
  }
}
```

```typescript
// src/index.ts
import Kernel from "@core/Kernel";
import GreetCommand from "./commands/GreetCommand";

async function main() {
  const kernel = new Kernel();
  await kernel.boot();
  kernel.registerCommand(GreetCommand);
  await kernel.parseAsync(process.argv);
}

main().catch(console.error);
```

运行：

```bash
node dist/index.js greet Alice
# 输出: [2024-01-01 10:00:00] INFO Hello, Alice!
```

---

## 关键要点总结

### 服务开发

1. **继承 Service 基类**
   ```typescript
   export default class MyService extends Service { }
   ```

2. **实现生命周期钩子**
   - `onRegister()` - 服务注册时（同步）
   - `onInit()` - 所有服务注册后（异步）
   - `onDestroy()` - 服务销毁时（异步）

3. **获取依赖服务**
   ```typescript
   const logger = this.requireService("logger"); // 必需
   const config = this.getService("config");     // 可选
   ```

4. **在 registry.ts 中注册**
   ```typescript
   export const serviceDefinitions = {
     myService: MyService,
   } as const;
   ```

### 命令开发

1. **继承 CommandBase 基类**
   ```typescript
   export default class MyCommand extends CommandBase { }
   ```

2. **实现 onEnable() 方法**
   ```typescript
   public onEnable(): void {
     this.program
       .name("my-command")
       .description("命令描述")
       .action(async () => { });
   }
   ```

3. **使用服务**
   ```typescript
   const service = this.requireService("serviceName");
   ```

4. **在 Kernel 中注册**
   ```typescript
   kernel.registerCommand(MyCommand);
   ```

---

## 常见问题

### Q: 服务什么时候被实例化？

A: 服务采用延迟实例化策略：
- 在 `kernel.boot()` 时，只是注册服务定义
- 在 `serviceManager.initAll()` 时，才实例化所有服务
- 也可以在首次调用 `requireService()` 时实例化

### Q: 如何在服务之间共享数据？

A: 通过依赖注入获取其他服务实例，所有服务都是单例的：

```typescript
class ServiceA extends Service {
  public data = "shared data";
}

class ServiceB extends Service {
  public onRegister(): void {
    const serviceA = this.requireService("serviceA");
    console.log(serviceA.data); // "shared data"
  }
}
```

### Q: 可以在 onRegister 中使用异步操作吗？

A: 不建议。`onRegister()` 是同步的，用于快速注册和获取依赖。异步操作应该放在 `onInit()` 中：

```typescript
public onRegister(): void {
  // ✅ 正确：获取依赖
  this.logger = this.requireService("logger");
}

public async onInit(): Promise<void> {
  // ✅ 正确：异步操作
  await this.connect();
}
```

### Q: 如何处理服务初始化失败？

A: 在 `onInit()` 中抛出错误，Kernel 会捕获并终止启动：

```typescript
public async onInit(): Promise<void> {
  if (!this.config.get("apiKey")) {
    throw new Error("API Key is required");
  }
}
```

---

## 下一步

现在你已经掌握了基础知识，可以继续学习：

- [核心组件详解](./CORE_COMPONENTS.md) - 深入了解每个核心组件
- [服务开发指南](./SERVICE_DEVELOPMENT.md) - 服务开发最佳实践
- [命令开发指南](./COMMAND_DEVELOPMENT.md) - 命令开发最佳实践
- [内置服务文档](./BUILT_IN_SERVICES.md) - 了解如何使用内置服务
- [API 参考](./API_REFERENCE.md) - 完整的 API 文档

---

## 获取帮助

如果遇到问题：

1. 查看 [常见问题](./FAQ.md)
2. 查看 [最佳实践](./BEST_PRACTICES.md)
3. 提交 Issue
4. 查看示例项目

祝你使用愉快！🚀

---

## 📖 文档导航

**上一篇：** [README](./README.md)  
**下一篇：** [架构概述](./ARCHITECTURE.md)