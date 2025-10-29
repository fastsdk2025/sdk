# @fastsdk2025/cli

一个基于依赖注入和服务化架构的现代化 CLI 框架。

## ✨ 特性

- 🏗️ **服务化架构** - 基于依赖注入的模块化设计
- 🔒 **类型安全** - 完整的 TypeScript 类型支持
- 🔄 **生命周期管理** - 清晰的服务初始化和销毁流程
- 🎯 **单例模式** - 自动管理服务实例
- 🔌 **易于扩展** - 简单的服务和命令注册机制
- 📝 **完善的文档** - 详细的开发指南和 API 参考

## 📦 安装

```bash
npm install @fastsdk2025/cli
# 或
pnpm add @fastsdk2025/cli
```

## 🚀 快速开始

### 创建应用入口

```typescript
// src/index.ts
import Kernel from "@core/Kernel";
import UploadCommand from "./commands/UploadCommand";

async function main() {
  const kernel = new Kernel();
  
  // 启动内核（自动初始化所有服务）
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

### 创建自定义服务

```typescript
// src/services/database/DatabaseService.ts
import Service from "@core/base/Service";

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

  public async query(sql: string): Promise<any[]> {
    // 查询逻辑
    return [];
  }
}
```

### 创建自定义命令

```typescript
// src/commands/UploadCommand.ts
import CommandBase from "@core/base/CommandBase";
import { Argument } from "commander";

export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .description("上传文件到云端")
      .addArgument(new Argument("<file>", "文件路径"))
      .option("-d, --dest <name>", "目标文件名")
      .action(async (file: string, options) => {
        const upload = this.requireService("upload");
        const logger = this.requireService("logger");
        
        try {
          logger.info(`正在上传: ${file}`);
          const url = await upload.uploadFile(file, options.dest);
          logger.info(`上传成功: ${url}`);
        } catch (error) {
          logger.error("上传失败:", error);
          process.exit(1);
        }
      });
  }
}
```

## 📚 文档

完整的文档请查看 [docs](./docs) 目录：

- [📖 README](./docs/README.md) - 文档导航
- [🏛️ 架构概述](./docs/ARCHITECTURE.md) - 了解整体架构设计和核心概念
- [⚡ 快速开始](./docs/GETTING_STARTED.md) - 5分钟快速上手指南
- [🔧 核心组件](./docs/CORE_COMPONENTS.md) - 核心组件详细说明
- [🛠️ 服务开发](./docs/SERVICE_DEVELOPMENT.md) - 如何开发自定义服务
- [💻 命令开发](./docs/COMMAND_DEVELOPMENT.md) - 如何开发自定义命令
- [📦 内置服务](./docs/BUILT_IN_SERVICES.md) - 内置服务使用指南
- [📘 API 参考](./docs/API_REFERENCE.md) - 完整的 API 文档
- [✅ 最佳实践](./docs/BEST_PRACTICES.md) - 开发最佳实践和设计模式

## 🎯 核心概念

### Kernel (内核)

应用的核心，负责启动和协调所有组件：

```typescript
const kernel = new Kernel();
await kernel.boot();
kernel.registerCommand(MyCommand);
```

### Service (服务)

可重用的功能模块，支持依赖注入和生命周期管理：

```typescript
export default class MyService extends Service {
  public onRegister(): void {
    // 获取依赖服务
  }
  
  public async onInit(): Promise<void> {
    // 异步初始化
  }
  
  public async onDestroy(): Promise<void> {
    // 清理资源
  }
}
```

### Command (命令)

CLI 命令实现，可以使用所有已注册的服务：

```typescript
export default class MyCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("my-command")
      .action(async () => {
        const service = this.requireService("myService");
        // 使用服务
      });
  }
}
```

## 🔌 内置服务

### LoggerService - 日志服务

```typescript
const logger = this.requireService("logger");

logger.info("信息日志");
logger.debug("调试日志");
logger.warn("警告日志");
logger.error("错误日志");

logger.setLevel("debug"); // 设置日志级别
```

### ConfigService - 配置服务

```typescript
const config = this.requireService("config");

// 读取配置
const cloudConfig = config.get("cloud");

// 设置配置
config.set("cloud", { oss: { ... } });

// 保存配置
config.save();
```

### UploadService - 上传服务

```typescript
const upload = this.requireService("upload");

// 上传单个文件
const url = await upload.uploadFile("/path/to/file.jpg");

// 批量上传
const urls = await upload.uploadMultiple([
  "/path/to/file1.jpg",
  "/path/to/file2.jpg",
]);
```

## 🛠️ 开发命令

```bash
# 开发模式（带源码映射）
pnpm dev

# 监听文件变化
pnpm watch

# 构建生产版本
pnpm build
```

## 📁 项目结构

```
src/
├── core/                      # 核心框架代码
│   ├── base/                  # 基类
│   │   ├── CommandBase.ts
│   │   └── Service.ts
│   ├── services/              # 核心服务
│   │   ├── logger/
│   │   ├── config/
│   │   ├── upload/
│   │   └── registry.ts
│   ├── Kernel.ts
│   ├── ServiceManager.ts
│   ├── constants.ts
│   └── types.ts
├── commands/                  # 命令实现
│   └── UploadCommand.ts
└── index.ts                   # 应用入口
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**文档版本**: v1.0.0  
**作者**: tuiu <13719283454@163.com>