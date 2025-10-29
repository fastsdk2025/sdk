# Fast CLI 核心架构文档

欢迎来到 Fast CLI 核心架构文档。本文档将帮助你理解和使用 Fast CLI 框架。

## 📚 文档导航

- [架构概述](./ARCHITECTURE.md) - 了解整体架构设计和核心概念
- [快速开始](./GETTING_STARTED.md) - 5分钟快速上手指南
- [核心组件](./CORE_COMPONENTS.md) - 核心组件详细说明
- [服务开发](./SERVICE_DEVELOPMENT.md) - 如何开发自定义服务
- [命令开发](./COMMAND_DEVELOPMENT.md) - 如何开发自定义命令
- [内置服务](./BUILT_IN_SERVICES.md) - 内置服务使用指南
- [API 参考](./API_REFERENCE.md) - 完整的 API 文档
- [最佳实践](./BEST_PRACTICES.md) - 开发最佳实践和设计模式

## 🚀 快速链接

### 核心概念

- **Kernel (内核)** - 应用的核心，负责启动和协调所有组件
- **ServiceManager (服务管理器)** - 管理服务的注册、实例化和生命周期
- **Service (服务)** - 可重用的功能模块，如日志、配置等
- **Command (命令)** - 具体的 CLI 命令实现

### 内置服务

- **LoggerService** - 日志记录服务
- **ConfigService** - 配置管理服务
- **UploadService** - 文件上传服务

## 🎯 快速示例

### 创建一个简单的服务

```typescript
import Service from "@core/base/Service";

export default class MyService extends Service {
  public onRegister(): void {
    const logger = this.requireService("logger");
    logger.info("MyService registered!");
  }

  public async onInit(): Promise<void> {
    // 初始化逻辑
  }

  public doSomething(): void {
    // 服务方法
  }
}
```

### 创建一个命令

```typescript
import CommandBase from "@core/base/CommandBase";

export default class MyCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("my-command")
      .description("我的命令")
      .action(async () => {
        const logger = this.requireService("logger");
        logger.info("执行我的命令");
      });
  }
}
```

## 📖 架构特点

### 依赖注入 (DI)

服务之间通过依赖注入解耦，便于测试和维护：

```typescript
// 在服务中获取其他服务
const logger = this.requireService("logger");
const config = this.getService("config");
```

### 生命周期管理

每个服务都有明确的生命周期：

1. **onRegister** - 服务注册时调用（同步）
2. **onInit** - 所有服务注册完成后调用（异步）
3. **onDestroy** - 服务销毁时调用（异步）

### 类型安全

完整的 TypeScript 类型支持，IDE 自动补全：

```typescript
// 服务名称和类型都是强类型的
const logger = this.requireService("logger"); // LoggerService
const config = this.requireService("config"); // ConfigService
```

## 🛠️ 技术栈

- **TypeScript** - 类型安全
- **Commander.js** - CLI 框架
- **Chalk** - 终端颜色
- **Ali-OSS** - 阿里云 OSS SDK

## 📝 版本信息

当前文档版本：v1.0.0

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

请查看项目根目录的 LICENSE 文件。

---

## 📖 文档导航

**下一篇：** [快速开始](./GETTING_STARTED.md)
