# Fast CLI 架构概述

## 目录

- [整体架构](#整体架构)
- [核心设计理念](#核心设计理念)
- [架构层次](#架构层次)
- [数据流向](#数据流向)
- [设计模式](#设计模式)
- [技术选型](#技术选型)

---

## 整体架构

Fast CLI 采用**分层架构**和**依赖注入**模式，构建了一个可扩展、可维护的 CLI 应用框架。

```
┌─────────────────────────────────────────────────────────┐
│                    应用入口 (main.ts)                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Kernel (应用内核)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  - 初始化服务管理器                                │  │
│  │  - 注册和管理命令                                  │  │
│  │  - 应用生命周期控制                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              ServiceManager (服务管理器)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  - 服务注册和定义                                  │  │
│  │  - 服务实例化 (单例模式)                           │  │
│  │  - 依赖注入                                       │  │
│  │  - 生命周期管理                                    │  │
│  │  - 循环依赖检测                                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Services (服务层)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Logger    │  │   Config    │  │   Upload    │    │
│  │   Service   │  │   Service   │  │   Service   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │                │                │              │
│         └────────────────┴────────────────┘              │
│                      Service Base                        │
│  - 提供服务基类和生命周期钩子                             │
│  - getService / requireService 方法                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Commands (命令层)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Upload    │  │   Config    │  │    Help     │    │
│  │   Command   │  │   Command   │  │   Command   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                    CommandBase                           │
│  - 提供命令基类                                          │
│  - 访问服务的便捷方法                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 核心设计理念

### 1. 关注点分离 (Separation of Concerns)

每个组件都有明确的职责：

- **Kernel**：应用生命周期管理
- **ServiceManager**：服务容器和依赖注入
- **Service**：业务逻辑和功能实现
- **Command**：用户交互和命令处理

### 2. 依赖倒置 (Dependency Inversion)

高层模块不依赖低层模块，都依赖于抽象：

```typescript
// Command 不直接依赖具体的服务实现
// 而是通过 ServiceManager 获取服务实例
const logger = this.requireService("logger");
```

### 3. 单一职责 (Single Responsibility)

每个类只负责一件事：

- `Kernel` 只负责应用启动和协调
- `ServiceManager` 只负责服务管理
- 每个 `Service` 只负责特定功能

### 4. 开闭原则 (Open/Closed)

对扩展开放，对修改关闭：

- 添加新服务：只需继承 `Service` 并注册
- 添加新命令：只需继承 `CommandBase` 并注册
- 无需修改核心代码

---

## 架构层次

### Layer 1: 基础层 (Base Layer)

```typescript
// 抽象基类
abstract class Service {
  onRegister?(): void;
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
}

abstract class CommandBase {
  abstract onEnable(): void;
  onDisable?(): void;
}
```

**职责**：
- 定义基础接口和生命周期
- 提供通用方法

### Layer 2: 核心层 (Core Layer)

```typescript
class Kernel extends Command {
  serviceManager: ServiceManager;
  boot(): Promise<void>;
  registerCommand(command): void;
}

class ServiceManager {
  define(name, ctor): void;
  get(name): Service;
  instantiate(name, ctor): Service;
  initAll(): Promise<void>;
}
```

**职责**：
- 应用启动和生命周期控制
- 服务注册、实例化和依赖注入
- 命令注册和管理

### Layer 3: 服务层 (Service Layer)

```typescript
class LoggerService extends Service {
  info(message): void;
  error(message): void;
}

class ConfigService extends Service {
  get(key): any;
  set(key, value): void;
}

class UploadService extends Service {
  uploadFile(file): Promise<string>;
}
```

**职责**：
- 实现具体的业务功能
- 可被其他服务或命令依赖

### Layer 4: 命令层 (Command Layer)

```typescript
class UploadCommand extends CommandBase {
  onEnable(): void {
    this.program
      .name("upload")
      .action(async (file) => {
        const upload = this.requireService("upload");
        await upload.uploadFile(file);
      });
  }
}
```

**职责**：
- 定义 CLI 命令
- 处理用户输入
- 调用服务完成任务

---

## 数据流向

### 应用启动流程

```
1. main.ts 创建 Kernel 实例
         ↓
2. Kernel.boot() 启动应用
         ↓
3. ServiceManager.defineMultiple() 注册所有服务定义
         ↓
4. ServiceManager.initAll() 初始化所有服务
         ↓
    4.1 实例化服务 (调用构造函数)
         ↓
    4.2 调用 onRegister() 钩子
         ↓
    4.3 调用 onInit() 钩子
         ↓
5. Kernel.registerCommand() 注册所有命令
         ↓
6. 应用就绪，等待用户输入
```

### 服务依赖解析流程

```
1. Service A 需要 Service B
         ↓
2. 调用 this.requireService("serviceB")
         ↓
3. ServiceManager.get("serviceB")
         ↓
4. 检查服务是否已实例化
    - 是：直接返回
    - 否：继续下一步
         ↓
5. ServiceManager.instantiate("serviceB")
         ↓
6. 创建 ServiceContext (包含依赖注入方法)
         ↓
7. new ServiceB(context)
         ↓
8. 调用 serviceB.onRegister()
         ↓
9. 缓存并返回 serviceB 实例
```

### 命令执行流程

```
1. 用户输入命令 (如: fast upload file.txt)
         ↓
2. Commander.js 解析命令和参数
         ↓
3. 触发对应的 Command.action()
         ↓
4. Command 通过 requireService() 获取服务
         ↓
5. 调用服务的方法执行业务逻辑
         ↓
6. 服务可能依赖其他服务 (递归依赖解析)
         ↓
7. 返回结果并输出到终端
```

---

## 设计模式

### 1. 依赖注入 (Dependency Injection)

**实现方式**：通过 `ServiceContext` 注入依赖

```typescript
class ServiceManager {
  private createContext(): ServiceContext {
    return {
      kernel: this.kernel,
      getService: (name) => this.get(name),
      requireService: (name) => this.require(name)
    };
  }

  instantiate(name, Ctor) {
    const context = this.createContext();
    return new Ctor(context);
  }
}
```

**优点**：
- 松耦合
- 易于测试（可 mock）
- 依赖关系清晰

### 2. 单例模式 (Singleton)

**实现方式**：ServiceManager 确保每个服务只实例化一次

```typescript
public get(name) {
  if (this.services.has(name)) {
    return this.services.get(name); // 返回缓存的实例
  }
  return this.instantiate(name); // 首次实例化
}
```

**优点**：
- 节省资源
- 状态共享
- 统一管理

### 3. 注册表模式 (Registry)

**实现方式**：集中管理服务定义

```typescript
export const serviceDefinitions = {
  logger: LoggerService,
  config: ConfigService,
  upload: UploadService,
} as const;

export type ServiceRegistry = {
  [K in keyof typeof serviceDefinitions]: InstanceType<
    typeof serviceDefinitions[K]
  >;
};
```

**优点**：
- 类型安全
- 统一配置
- 易于管理

### 4. 模板方法模式 (Template Method)

**实现方式**：定义生命周期钩子

```typescript
abstract class Service {
  // 模板方法 - 子类可选实现
  onRegister?(): void;
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
}
```

**优点**：
- 统一生命周期
- 易于扩展
- 代码复用

### 5. 策略模式 (Strategy)

**体现**：不同的服务实现不同的策略

```typescript
// 不同的日志级别策略
logger.setLevel("debug"); // 显示所有日志
logger.setLevel("error"); // 只显示错误
```

---

## 技术选型

### 核心依赖

| 技术 | 版本 | 用途 | 选择原因 |
|------|------|------|----------|
| TypeScript | 5.x | 类型系统 | 类型安全、IDE 支持好 |
| Commander.js | 11.x | CLI 框架 | 成熟稳定、API 简洁 |
| Chalk | 5.x | 终端颜色 | 轻量、易用 |
| Ali-OSS | latest | 文件上传 | 官方 SDK、功能完整 |

### 架构优势

1. **类型安全**
   - 完整的 TypeScript 类型推断
   - 编译时错误检查
   - 优秀的 IDE 支持

2. **可测试性**
   - 依赖注入便于 mock
   - 每个服务独立可测
   - 生命周期清晰

3. **可扩展性**
   - 插件化的服务系统
   - 声明式的命令注册
   - 开闭原则

4. **可维护性**
   - 代码组织清晰
   - 职责明确
   - 易于理解

---

## 与其他框架对比

### vs NestJS CLI

| 特性 | Fast CLI | NestJS |
|------|----------|--------|
| 学习曲线 | 平缓 | 陡峭 |
| 代码量 | 轻量 | 重量级 |
| 适用场景 | 中小型 CLI | 大型企业应用 |
| 依赖注入 | ✅ | ✅ |
| 装饰器 | ❌ | ✅ |

### vs oclif

| 特性 | Fast CLI | oclif |
|------|----------|-------|
| 类型安全 | ✅ 强类型 | ⚠️ 部分支持 |
| 插件系统 | ❌ | ✅ |
| 生命周期 | ✅ 完整 | ⚠️ 简单 |
| 服务容器 | ✅ | ❌ |

### vs Yargs

| 特性 | Fast CLI | Yargs |
|------|----------|-------|
| 架构 | 分层架构 | 配置式 |
| 依赖注入 | ✅ | ❌ |
| 类型支持 | ✅ 原生 | ⚠️ 需配置 |
| 易用性 | 中等 | 简单 |

---

## 未来规划

### 短期目标

- [ ] 添加配置 Schema 验证
- [ ] 实现服务初始化顺序控制
- [ ] 完善错误处理机制
- [ ] 添加单元测试

### 长期目标

- [ ] 插件系统
- [ ] 中间件支持
- [ ] 性能监控
- [ ] 热重载（开发模式）
- [ ] 命令自动补全

---

## 总结

Fast CLI 是一个设计良好、类型安全、易于扩展的 CLI 框架。通过依赖注入和服务化架构，它提供了清晰的代码组织和优秀的开发体验。

**适用场景**：
- ✅ 中小型 CLI 工具
- ✅ 需要类型安全的项目
- ✅ 团队协作开发
- ✅ 需要良好扩展性的应用

**不适用场景**：
- ❌ 简单的单文件脚本（过度设计）
- ❌ 需要极致性能的场景（有一定抽象开销）

---

## 📖 文档导航

**上一篇：** [快速开始](./GETTING_STARTED.md)  
**下一篇：** [核心组件详解](./CORE_COMPONENTS.md)