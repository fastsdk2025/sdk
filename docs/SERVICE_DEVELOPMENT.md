# 服务开发指南

本指南将教你如何开发自定义服务。

## 目录

- [什么是服务](#什么是服务)
- [创建服务的步骤](#创建服务的步骤)
- [生命周期管理](#生命周期管理)
- [依赖注入](#依赖注入)
- [最佳实践](#最佳实践)
- [常见模式](#常见模式)
- [测试服务](#测试服务)
- [故障排查](#故障排查)

---

## 什么是服务

服务是 Fast CLI 中可重用的功能模块。每个服务：

- ✅ **单例**: 全局只有一个实例
- ✅ **生命周期管理**: 有明确的初始化和销毁流程
- ✅ **依赖注入**: 可以依赖其他服务
- ✅ **类型安全**: 完整的 TypeScript 类型支持

### 服务 vs 普通类

| 特性 | 服务 | 普通类 |
|------|------|--------|
| 实例化 | 自动（单例） | 手动（new） |
| 生命周期 | 有钩子 | 无 |
| 依赖注入 | 支持 | 不支持 |
| 全局访问 | 支持 | 不支持 |

---

## 创建服务的步骤

### 步骤 1: 创建服务文件

```typescript
// src/core/services/database/DatabaseService.ts
import Service from "@core/base/Service";
import LoggerService from "../logger/LoggerService";

export default class DatabaseService extends Service {
  private logger!: LoggerService;
  private connection: any = null;

  public onRegister(): void {
    this.logger = this.requireService("logger");
  }

  public async onInit(): Promise<void> {
    await this.connect();
  }

  public async onDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    // 连接数据库
  }

  private async disconnect(): Promise<void> {
    // 断开连接
  }

  public async query(sql: string): Promise<any[]> {
    // 执行查询
    return [];
  }
}
```

### 步骤 2: 注册服务

```typescript
// src/core/services/registry.ts
import DatabaseService from "./database/DatabaseService";

export const serviceDefinitions = {
  logger: LoggerService,
  config: ConfigService,
  upload: UploadService,
  database: DatabaseService, // 新增
} as const;

// 类型会自动推断
export type ServiceRegistry = {
  [K in keyof typeof serviceDefinitions]: InstanceType<
    (typeof serviceDefinitions)[K]
  >;
};

export type ServiceName = keyof typeof serviceDefinitions;
export type ServiceConstructor = (typeof serviceDefinitions)[ServiceName];
```

### 步骤 3: 使用服务

```typescript
// 在其他服务中使用
export default class UserService extends Service {
  private db!: DatabaseService;

  public onRegister(): void {
    this.db = this.requireService("database");
  }

  public async getUsers(): Promise<any[]> {
    return await this.db.query("SELECT * FROM users");
  }
}

// 在命令中使用
export default class QueryCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("query")
      .action(async () => {
        const db = this.requireService("database");
        const results = await db.query("SELECT * FROM users");
        console.log(results);
      });
  }
}
```

---

## 生命周期管理

### 生命周期流程

```
1. 定义 (registry.ts)
   serviceDefinitions = { database: DatabaseService }
   
2. 启动 (kernel.boot())
   serviceManager.defineMultiple(serviceDefinitions)
   
3. 实例化 (首次访问或 initAll)
   new DatabaseService(context)
   
4. 注册 (同步)
   service.onRegister()
   - 获取依赖服务
   - 快速初始化
   
5. 初始化 (异步)
   service.onInit()
   - 异步操作
   - 连接资源
   
6. 运行中
   service.query(...)
   
7. 销毁 (应用退出或手动销毁)
   service.onDestroy()
   - 清理资源
   - 保存状态
```

### onRegister() - 注册钩子

**特点**:
- 同步执行
- 在实例化后立即调用
- 所有服务都可访问（但可能未初始化）

**用途**:
```typescript
public onRegister(): void {
  // ✅ 获取依赖服务
  this.logger = this.requireService("logger");
  this.config = this.requireService("config");
  
  // ✅ 简单的同步初始化
  this.cache = new Map();
  this.counter = 0;
  
  // ✅ 注册事件监听器
  process.on("SIGINT", this.handleSignal.bind(this));
  
  // ❌ 不要进行异步操作
  // await this.connect(); // 错误！
}
```

### onInit() - 初始化钩子

**特点**:
- 异步执行
- 所有服务注册完成后调用
- 可以安全地使用其他服务

**用途**:
```typescript
public async onInit(): Promise<void> {
  // ✅ 异步操作
  await this.connect();
  await this.loadData();
  
  // ✅ 读取配置
  const config = this.requireService("config");
  this.apiKey = config.get("apiKey");
  
  // ✅ 验证状态
  if (!this.apiKey) {
    throw new Error("API key is required");
  }
  
  // ✅ 初始化完成日志
  this.logger.info("DatabaseService initialized");
}
```

### onDestroy() - 销毁钩子

**特点**:
- 异步执行
- 应用退出或手动销毁时调用
- 用于清理资源

**用途**:
```typescript
public async onDestroy(): Promise<void> {
  // ✅ 关闭连接
  if (this.connection) {
    await this.connection.close();
  }
  
  // ✅ 保存状态
  await this.saveState();
  
  // ✅ 清理定时器
  if (this.timer) {
    clearInterval(this.timer);
  }
  
  // ✅ 移除事件监听器
  process.off("SIGINT", this.handleSignal);
  
  this.logger.info("DatabaseService destroyed");
}
```

---

## 依赖注入

### 基本依赖注入

```typescript
export default class EmailService extends Service {
  private logger!: LoggerService;
  private config!: ConfigService;

  public onRegister(): void {
    // 必需的依赖 - 不存在会抛出错误
    this.logger = this.requireService("logger");
    
    // 可选的依赖 - 不存在返回 undefined
    this.config = this.getService("config");
  }
}
```

### 延迟依赖注入

```typescript
export default class CacheService extends Service {
  private logger!: LoggerService;
  
  public onRegister(): void {
    this.logger = this.requireService("logger");
  }

  public getData(key: string): any {
    // 在使用时才获取依赖（延迟注入）
    const db = this.getService("database");
    if (db) {
      return db.query(`SELECT * FROM cache WHERE key = '${key}'`);
    }
    return this.memoryCache.get(key);
  }
}
```

### 条件依赖注入

```typescript
export default class NotificationService extends Service {
  private logger!: LoggerService;
  private email?: EmailService;
  private sms?: SmsService;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    
    // 根据配置决定使用哪个服务
    const config = this.requireService("config");
    const notifyType = config.get("notifyType");
    
    if (notifyType === "email") {
      this.email = this.requireService("email");
    } else if (notifyType === "sms") {
      this.sms = this.requireService("sms");
    }
  }

  public async notify(message: string): Promise<void> {
    if (this.email) {
      await this.email.send(message);
    } else if (this.sms) {
      await this.sms.send(message);
    }
  }
}
```

### 访问 Kernel

```typescript
export default class MyService extends Service {
  public onRegister(): void {
    // 通过 context 访问 Kernel
    const kernel = this.context.kernel;
    
    // 获取版本信息
    const version = kernel.version();
    
    // 访问 ServiceManager
    const serviceManager = kernel.serviceManager;
  }
}
```

---

## 最佳实践

### 1. 明确的职责

**好的做法** ✅:
```typescript
// DatabaseService 只负责数据库操作
export default class DatabaseService extends Service {
  public async query(sql: string): Promise<any[]> { }
  public async insert(table: string, data: any): Promise<void> { }
  public async update(table: string, data: any): Promise<void> { }
}

// UserService 负责用户业务逻辑
export default class UserService extends Service {
  private db!: DatabaseService;
  
  public async getUser(id: number): Promise<User> {
    const rows = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return this.transformUser(rows[0]);
  }
}
```

**不好的做法** ❌:
```typescript
// DatabaseService 包含了业务逻辑
export default class DatabaseService extends Service {
  public async getUserWithPosts(id: number): Promise<User> {
    // 混合了数据访问和业务逻辑
  }
}
```

### 2. 依赖声明

**好的做法** ✅:
```typescript
export default class UserService extends Service {
  // 明确声明依赖
  private logger!: LoggerService;
  private db!: DatabaseService;
  private cache!: CacheService;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.db = this.requireService("database");
    this.cache = this.requireService("cache");
  }
}
```

**不好的做法** ❌:
```typescript
export default class UserService extends Service {
  public async getUser(id: number): Promise<User> {
    // 每次使用时都获取服务
    const db = this.requireService("database");
    return await db.query(...);
  }
}
```

### 3. 错误处理

**好的做法** ✅:
```typescript
export default class DatabaseService extends Service {
  private logger!: LoggerService;

  public async onInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error("Failed to connect to database:", error);
      throw new Error("Database initialization failed", { cause: error });
    }
  }

  public async query(sql: string): Promise<any[]> {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    
    try {
      return await this.connection.query(sql);
    } catch (error) {
      this.logger.error("Query failed:", sql, error);
      throw new Error("Database query failed", { cause: error });
    }
  }
}
```

### 4. 配置验证

**好的做法** ✅:
```typescript
export default class EmailService extends Service {
  private config!: ConfigService;
  private smtpConfig?: SmtpConfig;

  public onRegister(): void {
    this.config = this.requireService("config");
  }

  public async onInit(): Promise<void> {
    // 读取并验证配置
    this.smtpConfig = this.config.get("email").smtp;
    
    if (!this.smtpConfig) {
      throw new Error("SMTP configuration is required");
    }
    
    // 验证必需字段
    const required = ["host", "port", "user", "password"];
    for (const field of required) {
      if (!this.smtpConfig[field]) {
        throw new Error(`SMTP ${field} is required`);
      }
    }
    
    await this.connect();
  }
}
```

### 5. 资源清理

**好的做法** ✅:
```typescript
export default class DatabaseService extends Service {
  private connection: any = null;
  private queryTimeout: NodeJS.Timeout | null = null;
  private exitHandler!: () => void;

  public onRegister(): void {
    this.exitHandler = this.handleExit.bind(this);
    process.on("exit", this.exitHandler);
  }

  public async onDestroy(): Promise<void> {
    // 清理定时器
    if (this.queryTimeout) {
      clearTimeout(this.queryTimeout);
      this.queryTimeout = null;
    }
    
    // 关闭连接
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    
    // 移除事件监听器
    process.off("exit", this.exitHandler);
  }
  
  private handleExit(): void {
    // 同步清理
  }
}
```

---

## 常见模式

### 模式 1: 连接池服务

```typescript
export default class PoolService extends Service {
  private logger!: LoggerService;
  private config!: ConfigService;
  private pool: any[] = [];
  private maxSize = 10;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");
  }

  public async onInit(): Promise<void> {
    this.maxSize = this.config.get("pool.maxSize") || 10;
    await this.initializePool();
  }

  private async initializePool(): Promise<void> {
    for (let i = 0; i < this.maxSize; i++) {
      this.pool.push(await this.createConnection());
    }
    this.logger.info(`Pool initialized with ${this.maxSize} connections`);
  }

  public async getConnection(): Promise<any> {
    if (this.pool.length === 0) {
      this.logger.warn("Pool exhausted, creating new connection");
      return await this.createConnection();
    }
    return this.pool.pop();
  }

  public releaseConnection(conn: any): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(conn);
    }
  }

  private async createConnection(): Promise<any> {
    // 创建连接
    return {};
  }

  public async onDestroy(): Promise<void> {
    for (const conn of this.pool) {
      await conn.close();
    }
    this.pool = [];
  }
}
```

### 模式 2: 缓存服务

```typescript
export default class CacheService extends Service {
  private logger!: LoggerService;
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  public onRegister(): void {
    this.logger = this.requireService("logger");
  }

  public async onInit(): Promise<void> {
    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  public set(key: string, value: any, ttl: number = 3600): void {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  }

  public get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`);
      return undefined;
    }

    return item.value as T;
  }

  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.logger.info("Cache cleared");
  }

  private cleanup(): void {
    const now = Date.now();
    let count = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.logger.debug(`Cleaned up ${count} expired cache entries`);
    }
  }

  public async onDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}
```

### 模式 3: HTTP 客户端服务

```typescript
import axios, { AxiosInstance } from "axios";

export default class HttpService extends Service {
  private logger!: LoggerService;
  private config!: ConfigService;
  private client!: AxiosInstance;

  public onRegister(): void {
    this.logger = this.requireService("logger");
    this.config = this.requireService("config");
  }

  public async onInit(): Promise<void> {
    const baseURL = this.config.get("api.baseURL");
    const timeout = this.config.get("api.timeout") || 5000;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`HTTP Request: ${config.method} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error("HTTP Request Error:", error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`HTTP Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error("HTTP Response Error:", error);
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }
}
```

### 模式 4: 事件总线服务

```typescript
type EventHandler = (...args: any[]) => void | Promise<void>;

export default class EventBusService extends Service {
  private logger!: LoggerService;
  private listeners: Map<string, EventHandler[]> = new Map();

  public onRegister(): void {
    this.logger = this.requireService("logger");
  }

  public on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    this.logger.debug(`Event listener registered: ${event}`);
  }

  public off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.logger.debug(`Event listener removed: ${event}`);
    }
  }

  public async emit(event: string, ...args: any[]): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) return;

    this.logger.debug(`Event emitted: ${event} (${handlers.length} listeners)`);

    for (const handler of handlers) {
      try {
        await handler(...args);
      } catch (error) {
        this.logger.error(`Event handler error for ${event}:`, error);
      }
    }
  }

  public once(event: string, handler: EventHandler): void {
    const wrapper = async (...args: any[]) => {
      this.off(event, wrapper);
      await handler(...args);
    };
    this.on(event, wrapper);
  }

  public async onDestroy(): Promise<void> {
    this.listeners.clear();
  }
}
```

---

## 测试服务

### 单元测试

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import CacheService from "./CacheService";
import LoggerService from "../logger/LoggerService";

describe("CacheService", () => {
  let cache: CacheService;
  let mockLogger: LoggerService;

  beforeEach(async () => {
    // 创建 mock logger
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    // 创建 mock context
    const mockContext = {
      kernel: {} as any,
      getService: vi.fn(),
      requireService: vi.fn((name) => {
        if (name === "logger") return mockLogger;
        throw new Error(`Service ${name} not found`);
      }),
    };

    // 创建服务实例
    cache = new CacheService(mockContext);
    cache.onRegister();
    await cache.onInit();
  });

  it("should set and get cache value", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return undefined for non-existent key", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should expire cache after TTL", async () => {
    cache.set("key1", "value1", 1); // 1 second TTL
    expect(cache.get("key1")).toBe("value1");
    
    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should clear all cache", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });
});
```

### 集成测试

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Kernel from "@core/Kernel";

describe("CacheService Integration", () => {
  let kernel: Kernel;
  let cache: CacheService;

  beforeAll(async () => {
    kernel = new Kernel();
    await kernel.boot();
    cache = kernel.serviceManager.require("cache");
  });

  afterAll(async () => {
    await kernel.serviceManager.destroyAll();
  });

  it("should integrate with logger service", () => {
    cache.set("key1", "value1");
    // Logger should have been called
  });
});
```

---

## 故障排查

### 常见问题

#### 1. 服务未定义

**错误**:
```
Error: Service "myService" not found or not registered
```

**原因**: 服务未在 `registry.ts` 中注册

**解决方案**:
```typescript
// src/core/services/registry.ts
export const serviceDefinitions = {
  // ...
  myService: MyService, // 添加这一行
} as const;
```

#### 2. 循环依赖

**错误**:
```
Error: Circular dependency detected when instantiating service "serviceA"
```

**原因**: 服务 A 依赖服务 B，服务 B 又依赖服务 A

**解决方案**:
- 重新设计服务依赖关系
- 将共同依赖提取到第三个服务
- 使用延迟注入

```typescript
// 不好 ❌
class ServiceA extends Service {
  private b!: ServiceB;
  public onRegister() {
    this.b = this.requireService("serviceB"); // 循环依赖
  }
}

class ServiceB extends Service {
  private a!: ServiceA;
  public onRegister() {
    this.a = this.requireService("serviceA"); // 循环依赖
  }
}

// 好 ✅
class ServiceA extends Service {
  public methodA() {
    // 延迟获取
    const b = this.getService("serviceB");
    if (b) b.methodB();
  }
}

class ServiceB extends Service {
  public methodB() {
    // 延迟获取
    const a = this.getService("serviceA");
    if (a) a.methodA();
  }
}
```

#### 3. 初始化失败

**错误**:
```
Error: Failed to initialize service "database"
```

**调试步骤**:
1. 检查 `onInit()` 中的错误信息
2. 验证配置是否正确
3. 检查依赖服务是否可用
4. 查看日志输出

**解决方案**:
```typescript
public async onInit(): Promise<void> {
  try {
    // 详细的错误信息
    this.logger.debug("Initializing database service...");
    
    const config = this.requireService("config");
    const dbUrl = config.get("database.url");
    
    if (!dbUrl) {
      throw new Error("Database URL not configured");
    }
    
    this.logger.debug(`Connecting to: ${dbUrl}`);
    await this.connect(dbUrl);
    
    this.logger.info("Database service initialized");
  } catch (error) {
    this.logger.error("Database initialization failed:", error);
    throw error;
  }
}
```

#### 4. 内存泄漏

**症状**: 应用运行一段时间后内存持续增长

**常见原因**:
- 事件监听器未清理
- 定时器未清理
- 缓存无限增长

**解决方案**:
```typescript
export default class MyService extends Service {
  private timer: NodeJS.Timeout | null = null;
  private handler!: () => void;

  public onRegister(): void {
    this.handler = this.handleEvent.bind(this);
    process.on("SIGINT", this.handler);
  }

  public async onInit(): Promise<void> {
    this.timer = setInterval(() => {
      // 定期任务
    }, 1000);
  }

  public async onDestroy(): Promise<void> {
    // ✅ 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // ✅ 清理事件监听器
    process.off("SIGINT", this.handler);
    
    // ✅ 清理缓存
    this.cache.clear();
  }
  
  private handleEvent(): void {
    // ...
  }
}
```

---

## 总结

开发服务的关键点：

1. **继承 Service 基类**
2. **在 registry.ts 中注册**
3. **实现生命周期钩子**
4. **使用依赖注入**
5. **遵循最佳实践**
6. **编写测试**
7. **正确清理资源**

通过遵循这些指南，你可以开发出高质量、可维护的服务。