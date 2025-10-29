# Fast CLI 最佳实践

本文档收集了使用 Fast CLI 框架的最佳实践和设计模式。

## 目录

- [项目结构](#项目结构)
- [服务设计](#服务设计)
- [命令设计](#命令设计)
- [错误处理](#错误处理)
- [性能优化](#性能优化)
- [安全性](#安全性)
- [测试策略](#测试策略)
- [代码风格](#代码风格)
- [文档编写](#文档编写)

---

## 项目结构

### 推荐的目录结构

```
src/
├── core/                      # 核心框架代码
│   ├── base/                  # 基类
│   │   ├── CommandBase.ts
│   │   └── Service.ts
│   ├── services/              # 核心服务
│   │   ├── logger/
│   │   │   ├── LoggerService.ts
│   │   │   ├── levels.ts
│   │   │   └── types.ts
│   │   ├── config/
│   │   │   ├── ConfigService.ts
│   │   │   └── types.ts
│   │   └── registry.ts        # 服务注册表
│   ├── Kernel.ts
│   ├── ServiceManager.ts
│   ├── constants.ts
│   └── types.ts
├── commands/                  # 命令实现
│   ├── UploadCommand.ts
│   ├── ConfigCommand.ts
│   └── InitCommand.ts
├── services/                  # 业务服务
│   ├── database/
│   │   ├── DatabaseService.ts
│   │   └── types.ts
│   └── cache/
│       ├── CacheService.ts
│       └── types.ts
├── utils/                     # 工具函数
│   ├── ensureDir.ts
│   ├── readJSON.ts
│   └── writeJSON.ts
└── index.ts                   # 应用入口
```

### 文件命名规范

**好的做法** ✅:
```
LoggerService.ts           # 服务类使用 PascalCase + Service 后缀
UploadCommand.ts           # 命令类使用 PascalCase + Command 后缀
DatabaseService.ts         # 清晰的命名
types.ts                   # 类型定义文件
constants.ts               # 常量定义文件
```

**不好的做法** ❌:
```
logger.ts                  # 不清楚是类还是实例
upload-command.ts          # 使用 kebab-case（不一致）
db.ts                      # 缩写不清晰
```

---

## 服务设计

### 单一职责原则

每个服务应该只负责一件事。

**好的做法** ✅:
```typescript
// LoggerService 只负责日志
export default class LoggerService extends Service {
  public info(message: string): void { }
  public error(message: string): void { }
}

// ConfigService 只负责配置
export default class ConfigService extends Service {
  public get(key: string): any { }
  public set(key: string, value: any): void { }
}

// DatabaseService 只负责数据访问
export default class DatabaseService extends Service {
  public async query(sql: string): Promise<any[]> { }
  public async insert(table: string, data: any): Promise<void> { }
}
```

**不好的做法** ❌:
```typescript
// 服务职责混乱
export default class UtilService extends Service {
  public log(message: string): void { }
  public saveConfig(key: string, value: any): void { }
  public queryDatabase(sql: string): any { }
  public uploadFile(file: string): void { }
}
```

### 依赖注入最佳实践

**在 onRegister 中获取依赖** ✅:
```typescript
export default class UserService extends Service {
  private logger!: LoggerService;
  private db!: DatabaseService;
  private cache!: CacheService;

  public onRegister(): void {
    // 在注册时获取所有依赖
    this.logger = this.requireService("logger");
    this.db = this.requireService("database");
    this.cache = this.requireService("cache");
  }

  public async getUser(id: number): Promise<User> {
    // 直接使用已获取的依赖
    const cached = this.cache.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    this.cache.set(`user:${id}`, user);
    return user;
  }
}
```

**不好的做法** ❌:
```typescript
export default class UserService extends Service {
  public async getUser(id: number): Promise<User> {
    // 每次调用都获取服务（低效）
    const db = this.requireService("database");
    const cache = this.requireService("cache");
    const logger = this.requireService("logger");
    
    // ...
  }
}
```

### 配置验证

**在 onInit 中验证配置** ✅:
```typescript
export default class EmailService extends Service {
  private config!: ConfigService;
  private smtpConfig?: SmtpConfig;

  public onRegister(): void {
    this.config = this.requireService("config");
  }

  public async onInit(): Promise<void> {
    // 读取配置
    this.smtpConfig = this.config.get("email").smtp;

    // 验证必需字段
    if (!this.smtpConfig) {
      throw new Error("SMTP configuration is required. Run 'fast init' first.");
    }

    this.validateConfig(this.smtpConfig);
    
    // 初始化连接
    await this.connect();
  }

  private validateConfig(config: SmtpConfig): void {
    const required = ["host", "port", "user", "password"];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`SMTP ${field} is required in configuration`);
      }
    }

    // 验证端口范围
    if (config.port < 1 || config.port > 65535) {
      throw new Error("SMTP port must be between 1 and 65535");
    }
  }
}
```

### 资源清理

**在 onDestroy 中清理资源** ✅:
```typescript
export default class DatabaseService extends Service {
  private connection: any = null;
  private timer: NodeJS.Timeout | null = null;
  private exitHandler!: () => void;

  public onRegister(): void {
    this.exitHandler = this.cleanup.bind(this);
    process.on("SIGINT", this.exitHandler);
    process.on("SIGTERM", this.exitHandler);
  }

  public async onInit(): Promise<void> {
    await this.connect();
    
    // 设置定时任务
    this.timer = setInterval(() => {
      this.keepAlive();
    }, 30000);
  }

  public async onDestroy(): Promise<void> {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // 关闭连接
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    // 移除事件监听器
    process.off("SIGINT", this.exitHandler);
    process.off("SIGTERM", this.exitHandler);
  }

  private cleanup(): void {
    // 同步清理
  }

  private keepAlive(): void {
    // 保持连接活跃
  }
}
```

---

## 命令设计

### 清晰的命令结构

**好的做法** ✅:
```typescript
export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .description("上传文件到云端")
      .argument("<file>", "要上传的文件路径")
      .option("-d, --dest <name>", "目标文件名")
      .option("-v, --verbose", "显示详细信息")
      .action(async (file: string, options) => {
        await this.execute(file, options);
      });
  }

  // 主执行逻辑
  private async execute(file: string, options: any): Promise<void> {
    try {
      await this.validateInput(file, options);
      await this.performUpload(file, options);
      this.showSuccess(file);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  // 验证输入
  private async validateInput(file: string, options: any): Promise<void> {
    const fs = require("fs");
    
    if (!fs.existsSync(file)) {
      throw new Error(`文件不存在: ${file}`);
    }

    const stats = await fs.promises.stat(file);
    if (!stats.isFile()) {
      throw new Error(`路径不是文件: ${file}`);
    }
  }

  // 执行上传
  private async performUpload(file: string, options: any): Promise<void> {
    const logger = this.requireService("logger");
    const upload = this.requireService("upload");

    if (options.verbose) {
      logger.setLevel("debug");
    }

    logger.info(`正在上传: ${file}`);
    await upload.uploadFile(file, options.dest);
  }

  // 显示成功信息
  private showSuccess(file: string): void {
    const logger = this.requireService("logger");
    logger.info(`✓ 上传成功: ${file}`);
  }

  // 处理错误
  private handleError(error: Error): void {
    const logger = this.requireService("logger");
    logger.error(`✗ 上传失败: ${error.message}`);
    process.exit(1);
  }
}
```

### 用户友好的输出

**好的做法** ✅:
```typescript
// 使用图标和颜色
logger.info("✓ 操作成功");
logger.error("✗ 操作失败");
logger.warn("⚠ 警告信息");

// 显示进度
logger.info(`[1/10] 处理文件...`);
logger.info(`[2/10] 上传文件...`);

// 清晰的错误信息和解决方案
logger.error("配置文件不存在");
logger.info("→ 解决方案: 运行 'fast init' 初始化配置");

// 表格输出
console.table([
  { name: "file1.txt", size: "1.2 MB", status: "✓" },
  { name: "file2.txt", size: "3.5 MB", status: "✓" },
]);
```

**不好的做法** ❌:
```typescript
// 不清晰的输出
console.log("done");
console.log("error");

// 技术性的错误信息
logger.error("ENOENT: no such file or directory");

// 没有上下文的输出
logger.info("Processing...");
logger.info("Done");
```

### 交互式提示

**使用交互式提示改善用户体验** ✅:
```typescript
import inquirer from "inquirer";

export default class InitCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("init")
      .option("--non-interactive", "非交互模式")
      .action(async (options) => {
        if (options.nonInteractive) {
          await this.initNonInteractive();
        } else {
          await this.initInteractive();
        }
      });
  }

  private async initInteractive(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "apiKey",
        message: "请输入 API Key:",
        validate: (input) => input.length > 0 || "API Key 不能为空",
      },
      {
        type: "password",
        name: "apiSecret",
        message: "请输入 API Secret:",
        mask: "*",
      },
      {
        type: "confirm",
        name: "confirm",
        message: "确认保存配置?",
        default: true,
      },
    ]);

    if (answers.confirm) {
      await this.saveConfig(answers);
    }
  }
}
```

---

## 错误处理

### 分层错误处理

**应用层错误处理** ✅:
```typescript
// 1. 服务层 - 抛出具体错误
export default class DatabaseService extends Service {
  public async query(sql: string): Promise<any[]> {
    if (!this.connection) {
      throw new Error("Database not connected");
    }

    try {
      return await this.connection.query(sql);
    } catch (error) {
      throw new Error(`Query failed: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }
}

// 2. 命令层 - 捕获并处理错误
export default class QueryCommand extends CommandBase {
  private async execute(sql: string): Promise<void> {
    const logger = this.requireService("logger");
    const db = this.requireService("database");

    try {
      const results = await db.query(sql);
      console.table(results);
    } catch (error) {
      const err = error as Error;
      
      // 根据错误类型提供友好的提示
      if (err.message.includes("not connected")) {
        logger.error("数据库未连接");
        logger.info("→ 请检查数据库配置");
      } else if (err.message.includes("Query failed")) {
        logger.error("查询失败");
        logger.info("→ 请检查 SQL 语法");
      } else {
        logger.error("未知错误:", err.message);
      }
      
      process.exit(1);
    }
  }
}
```

### 自定义错误类型

**创建自定义错误** ✅:
```typescript
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public exitCode: number = 1
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR", 2);
    this.name = "ConfigError";
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR", 3);
    this.name = "NetworkError";
  }
}

// 使用
throw new ConfigError("API Key is required");
throw new NetworkError("Connection timeout");
```

### 优雅的错误恢复

**提供回退方案** ✅:
```typescript
export default class CacheService extends Service {
  private memoryCache: Map<string, any> = new Map();
  private redisClient: any = null;

  public async get(key: string): Promise<any> {
    try {
      // 尝试从 Redis 获取
      if (this.redisClient) {
        return await this.redisClient.get(key);
      }
    } catch (error) {
      this.logger.warn("Redis 获取失败，使用内存缓存");
    }

    // 回退到内存缓存
    return this.memoryCache.get(key);
  }

  public async set(key: string, value: any): Promise<void> {
    // 始终写入内存缓存
    this.memoryCache.set(key, value);

    // 尝试写入 Redis
    try {
      if (this.redisClient) {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.warn("Redis 写入失败，仅使用内存缓存");
    }
  }
}
```

---

## 性能优化

### 懒加载和缓存

**懒加载服务** ✅:
```typescript
export default class MyService extends Service {
  private _heavyService?: HeavyService;

  private get heavyService(): HeavyService {
    if (!this._heavyService) {
      this._heavyService = this.requireService("heavy");
    }
    return this._heavyService;
  }

  public doSomething(): void {
    // 只在需要时加载
    if (needsHeavyService) {
      this.heavyService.process();
    }
  }
}
```

**缓存结果** ✅:
```typescript
export default class DataService extends Service {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  public async getData(key: string): Promise<any> {
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // 获取数据
    const data = await this.fetchData(key);

    // 缓存结果（5分钟）
    this.cache.set(key, {
      data,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    return data;
  }
}
```

### 批量操作

**批量处理提高效率** ✅:
```typescript
export default class UploadService extends Service {
  // 批量上传
  public async uploadMultiple(files: string[]): Promise<string[]> {
    const logger = this.requireService("logger");
    
    // 使用 Promise.all 并行上传
    const uploads = files.map((file) => this.uploadFile(file));
    
    try {
      return await Promise.all(uploads);
    } catch (error) {
      logger.error("批量上传失败:", error);
      throw error;
    }
  }

  // 带并发控制的批量上传
  public async uploadMultipleWithLimit(
    files: string[],
    concurrency: number = 3
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((file) => this.uploadFile(file))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
}
```

### 避免阻塞

**使用异步操作** ✅:
```typescript
// 好 ✅
public async processFiles(files: string[]): Promise<void> {
  for (const file of files) {
    await this.processFile(file);
  }
}

// 不好 ❌
public processFilesSync(files: string[]): void {
  const fs = require("fs");
  for (const file of files) {
    const content = fs.readFileSync(file); // 阻塞操作
    // ...
  }
}
```

---

## 安全性

### 输入验证

**验证所有用户输入** ✅:
```typescript
export default class ConfigCommand extends CommandBase {
  private async setConfig(key: string, value: string): Promise<void> {
    // 验证键名
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
      throw new Error("配置键只能包含字母、数字、点、下划线和连字符");
    }

    // 验证值
    if (value.length > 1000) {
      throw new Error("配置值过长（最大 1000 字符）");
    }

    // 防止注入
    const sanitized = this.sanitize(value);
    
    const config = this.requireService("config");
    config.set(key, sanitized);
  }

  private sanitize(input: string): string {
    // 移除危险字符
    return input.replace(/[<>]/g, "");
  }
}
```

### 敏感信息处理

**保护敏感信息** ✅:
```typescript
export default class ConfigService extends Service {
  public get<K extends keyof IConfig>(key: K): IConfig[K] {
    return this.data[key];
  }

  // 打印配置时隐藏敏感信息
  public printConfig(): void {
    const config = { ...this.data };
    
    // 隐藏敏感字段
    if (config.cloud?.oss) {
      config.cloud.oss = {
        ...config.cloud.oss,
        apiKeySecret: "***hidden***",
      };
    }

    console.log(JSON.stringify(config, null, 2));
  }

  // 日志中隐藏敏感信息
  public save(): void {
    this.logger.debug("Saving config:", this.maskSensitive(this.data));
    writeJSON(ConfigService.CONFIG_FILE, this.data);
  }

  private maskSensitive(data: any): any {
    // 递归隐藏敏感字段
    const masked = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = ["password", "secret", "token", "apiKey"];
    
    const mask = (obj: any) => {
      for (const key in obj) {
        if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
          obj[key] = "***";
        } else if (typeof obj[key] === "object") {
          mask(obj[key]);
        }
      }
    };
    
    mask(masked);
    return masked;
  }
}
```

### 文件权限

**设置正确的文件权限** ✅:
```typescript
import { chmod, writeFile } from "fs/promises";

export default class ConfigService extends Service {
  public async save(): Promise<void> {
    const content = JSON.stringify(this.data, null, 2);
    
    // 写入文件
    await writeFile(ConfigService.CONFIG_FILE, content);
    
    // 设置权限为仅所有者可读写 (600)
    await chmod(ConfigService.CONFIG_FILE, 0o600);
    
    this.logger.debug("Config saved with secure permissions");
  }
}
```

---

## 测试策略

### 单元测试

**测试服务逻辑** ✅:
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import CacheService from "./CacheService";

describe("CacheService", () => {
  let cache: CacheService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const mockContext = {
      kernel: {} as any,
      requireService: vi.fn(() => mockLogger),
    } as any;

    cache = new CacheService(mockContext);
    cache.onRegister();
    await cache.onInit();
  });

  it("should set and get value", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return undefined for non-existent key", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should expire after TTL", async () => {
    cache.set("key1", "value1", 1);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(cache.get("key1")).toBeUndefined();
  });
});
```

### 集成测试

**测试完整流程** ✅:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Kernel from "@core/Kernel";

describe("Upload Flow", () => {
  let kernel: Kernel;

  beforeAll(async () => {
    kernel = new Kernel();
    await kernel.boot();
  });

  afterAll(async () => {
    await kernel.serviceManager.destroyAll();
  });

  it("should upload file successfully", async () => {
    const upload = kernel.serviceManager.require("upload");
    const url = await upload.uploadFile("test.txt");
    expect(url).toContain("http");
  });
});
```

### 测试覆盖率

**追求高覆盖率** ✅:
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "vitest": {
    "coverage": {
      "reporter": ["text", "html"],
      "exclude": ["**/node_modules/**", "**/dist/**"],
      "lines": 80,
      "functions": 80,
      "branches": 80,
      "statements": 80
    }
  }
}
```

---

## 代码风格

### TypeScript 最佳实践

**使用严格的类型** ✅:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}

// 代码中使用明确的类型
export default class UserService extends Service {
  // ✅ 好 - 明确的类型
  private users: Map<number, User> = new Map();
  
  public async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  // ❌ 不好 - 隐式 any
  private data: any;
  
  public getData(): any {
    return this.data;
  }
}
```

### 命名规范

**使用清晰的命名** ✅:
```typescript
// ✅ 好的命名
export default class UserService extends Service {
  private activeUsers: Map<number, User> = new Map();
  
  public async getUserById(id: number): Promise<User | undefined> {
    return this.activeUsers.get(id);
  }

  public async createNewUser(userData: CreateUserDto): Promise<User> {
    // ...
  }
}

// ❌ 不好的命名
export default class UserService extends Service {
  private data: Map<number, any> = new Map();
  
  public async get(id: number): Promise<any> {
    return this.data.get(id);
  }

  public async create(d: any): Promise<any> {
    // ...
  }
}
```

### 代码组织

**逻辑分组** ✅:
```typescript
export default class UserService extends Service {
  // 1. 属性声明
  private logger!: LoggerService;
  private db!: DatabaseService;
  private users: Map<number, User> = new Map();

  // 2. 生命周期钩子
  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.db = this.requireService("database");
  }

  public async onInit(): Promise<void> {
    await this.loadUsers();
  }

  public async onDestroy(): Promise<void> {
    this.users.clear();
  }

  // 3. 公共方法
  public async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  public async createUser(data: CreateUserDto): Promise<User> {
    // ...
  }

  // 4. 私有辅助方法
  private async loadUsers(): Promise<void> {
    // ...
  }

  private validateUser(user: User): boolean {
    // ...
  }
}
```

---

## 文档编写

### 代码注释

**编写有意义的注释** ✅:
```typescript
export default class CacheService extends Service {
  /**
   * 获取缓存值
   * 
   * @param key - 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 undefined
   * 
   * @example
   * ```typescript
   * const user = cache.get<User>("user:123");
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   */
  public get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value as T;
  }

  /**
   * 设置缓存值
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（秒），默认 3600 秒（1小时）
   * 
   * @example
   * ```typescript
   * // 缓存 1 小时
   * cache.set("user:123", user);
   * 
   * // 缓存 5 分钟
   * cache.set("temp:data", data, 300);
   * ```
   */
  public set(key: string, value: any, ttl: number = 3600): void {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiry });
  }
}
```

### README 文档

**项目 README 应包含** ✅:
```markdown
# Fast CLI

简短描述项目

## 功能特性

- ✅ 功能 1
- ✅ 功能 2
- ✅ 功能 3

## 安装

\`\`\`bash
npm install
\`\`\`

## 快速开始

\`\`\`bash
fast init
fast upload file.txt
\`\`\`

## 配置

详细的配置说明

## 命令

### upload

上传文件到云端

\`\`\`bash
fast upload <file> [options]
\`\`\`

## 开发

\`\`\`bash
npm run dev
npm run build
npm test
\`\`\`

## 许可证

MIT
```

---

## 总结

遵循这些最佳