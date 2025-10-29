# 命令开发指南

本指南将教你如何开发自定义 CLI 命令。

## 目录

- [什么是命令](#什么是命令)
- [创建命令的步骤](#创建命令的步骤)
- [命令配置](#命令配置)
- [参数和选项](#参数和选项)
- [使用服务](#使用服务)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)
- [常见模式](#常见模式)
- [测试命令](#测试命令)

---

## 什么是命令

命令是用户与 CLI 应用交互的入口点。每个命令：

- ✅ **继承 CommandBase**: 获得访问服务的能力
- ✅ **配置式定义**: 使用 Commander.js 的 API 定义命令
- ✅ **访问服务**: 可以使用所有已注册的服务
- ✅ **类型安全**: 完整的 TypeScript 支持

### 命令示例

```bash
# 基础命令
fast upload file.txt

# 带选项的命令
fast upload file.txt --dest /path/to/dest.txt

# 带参数的命令
fast config set key value

# 子命令
fast db migrate
fast db seed
```

---

## 创建命令的步骤

### 步骤 1: 创建命令文件

```typescript
// src/commands/UploadCommand.ts
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
      logger.info(`正在上传: ${file}`);
      const url = await upload.uploadFile(file, options.dest);
      logger.info(`上传成功: ${url}`);
    } catch (error) {
      logger.error("上传失败:", error);
      process.exit(1);
    }
  }
}
```

### 步骤 2: 注册命令

```typescript
// src/index.ts
import Kernel from "@core/Kernel";
import UploadCommand from "./commands/UploadCommand";

async function main() {
  const kernel = new Kernel();
  await kernel.boot();

  // 注册命令
  kernel.registerCommand(UploadCommand);

  await kernel.parseAsync(process.argv);
}

main().catch(console.error);
```

### 步骤 3: 运行命令

```bash
node dist/index.js upload file.txt
node dist/index.js upload file.txt --dest dest.txt
node dist/index.js upload --help
```

---

## 命令配置

### 基本配置

```typescript
export default class MyCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("my-command")              // 命令名称
      .description("命令描述")          // 命令描述
      .usage("[options] <file>")       // 使用说明
      .version("1.0.0")                // 版本号
      .action(async () => {            // 命令动作
        // 执行逻辑
      });
  }
}
```

### 别名

```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .alias("up")  // 可以使用 fast up
    .description("上传文件");
}
```

### 示例

```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .description("上传文件到云端")
    .addHelpText("after", `
示例:
  $ fast upload file.txt
  $ fast upload file.txt --dest /path/to/dest.txt
  $ fast upload *.jpg --verbose
    `);
}
```

---

## 参数和选项

### 参数 (Arguments)

参数是必需的位置参数。

#### 单个参数

```typescript
import { Argument } from "commander";

public onEnable(): void {
  this.program
    .name("delete")
    .description("删除文件")
    .addArgument(
      new Argument("<file>", "要删除的文件路径")
    )
    .action(async (file: string) => {
      console.log(`删除文件: ${file}`);
    });
}

// 使用: fast delete file.txt
```

#### 多个参数

```typescript
public onEnable(): void {
  this.program
    .name("copy")
    .description("复制文件")
    .addArgument(
      new Argument("<source>", "源文件路径")
    )
    .addArgument(
      new Argument("<dest>", "目标文件路径")
    )
    .action(async (source: string, dest: string) => {
      console.log(`复制 ${source} 到 ${dest}`);
    });
}

// 使用: fast copy file1.txt file2.txt
```

#### 可选参数

```typescript
public onEnable(): void {
  this.program
    .name("list")
    .description("列出文件")
    .addArgument(
      new Argument("[dir]", "目录路径").default(".")
    )
    .action(async (dir: string) => {
      console.log(`列出目录: ${dir}`);
    });
}

// 使用: fast list
// 使用: fast list /path/to/dir
```

#### 可变参数

```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .description("上传多个文件")
    .argument("<files...>", "文件列表")
    .action(async (files: string[]) => {
      console.log(`上传 ${files.length} 个文件`);
    });
}

// 使用: fast upload file1.txt file2.txt file3.txt
```

#### 参数验证

```typescript
public onEnable(): void {
  this.program
    .name("set-port")
    .description("设置端口号")
    .addArgument(
      new Argument("<port>", "端口号")
        .argParser((value) => {
          const port = parseInt(value, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error("端口号必须在 1-65535 之间");
          }
          return port;
        })
    )
    .action(async (port: number) => {
      console.log(`端口设置为: ${port}`);
    });
}
```

### 选项 (Options)

选项是可选的命名参数。

#### 布尔选项

```typescript
import { Option } from "commander";

public onEnable(): void {
  this.program
    .name("upload")
    .description("上传文件")
    .argument("<file>", "文件路径")
    .addOption(
      new Option("-v, --verbose", "显示详细信息")
    )
    .action(async (file: string, options) => {
      if (options.verbose) {
        console.log("详细模式已启用");
      }
    });
}

// 使用: fast upload file.txt -v
// 使用: fast upload file.txt --verbose
```

#### 值选项

```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .argument("<file>", "文件路径")
    .addOption(
      new Option("-d, --dest <path>", "目标路径")
    )
    .action(async (file: string, options) => {
      console.log(`目标路径: ${options.dest}`);
    });
}

// 使用: fast upload file.txt -d /path/to/dest
// 使用: fast upload file.txt --dest /path/to/dest
```

#### 默认值

```typescript
public onEnable(): void {
  this.program
    .name("upload")
    .argument("<file>", "文件路径")
    .addOption(
      new Option("-r, --retries <count>", "重试次数")
        .default(3)
    )
    .action(async (file: string, options) => {
      console.log(`重试次数: ${options.retries}`);
    });
}

// 使用: fast upload file.txt (retries = 3)
// 使用: fast upload file.txt -r 5 (retries = 5)
```

#### 选择选项

```typescript
public onEnable(): void {
  this.program
    .name("log")
    .description("设置日志级别")
    .addOption(
      new Option("-l, --level <level>", "日志级别")
        .choices(["debug", "info", "warn", "error"])
        .default("info")
    )
    .action(async (options) => {
      const logger = this.requireService("logger");
      logger.setLevel(options.level);
    });
}

// 使用: fast log -l debug
```

#### 必需选项

```typescript
public onEnable(): void {
  this.program
    .name("login")
    .description("登录")
    .addOption(
      new Option("-u, --username <name>", "用户名")
        .makeOptionMandatory()
    )
    .addOption(
      new Option("-p, --password <pass>", "密码")
        .makeOptionMandatory()
    )
    .action(async (options) => {
      console.log(`登录: ${options.username}`);
    });
}

// 使用: fast login -u alice -p 123456
```

#### 环境变量

```typescript
public onEnable(): void {
  this.program
    .name("deploy")
    .description("部署应用")
    .addOption(
      new Option("--api-key <key>", "API Key")
        .env("API_KEY")  // 从环境变量读取
    )
    .action(async (options) => {
      console.log(`API Key: ${options.apiKey}`);
    });
}

// 使用: API_KEY=xxx fast deploy
// 使用: fast deploy --api-key xxx
```

---

## 使用服务

### 获取服务

```typescript
export default class MyCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("my-command")
      .action(async () => {
        // 必需的服务 - 不存在会抛出错误
        const logger = this.requireService("logger");
        
        // 可选的服务 - 不存在返回 undefined
        const upload = this.getService("upload");
        
        if (upload) {
          await upload.uploadFile("file.txt");
        }
      });
  }
}
```

### 在多个方法中使用服务

```typescript
export default class MyCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("my-command")
      .action(async () => {
        await this.execute();
      });
  }

  private async execute(): Promise<void> {
    const logger = this.requireService("logger");
    const config = this.requireService("config");
    const upload = this.requireService("upload");

    logger.info("开始执行");
    
    const files = config.get("files");
    for (const file of files) {
      await upload.uploadFile(file);
    }
    
    logger.info("执行完成");
  }
}
```

---

## 错误处理

### 基本错误处理

```typescript
export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .argument("<file>", "文件路径")
      .action(async (file: string) => {
        try {
          await this.handleUpload(file);
        } catch (error) {
          this.handleError(error as Error);
        }
      });
  }

  private async handleUpload(file: string): Promise<void> {
    const upload = this.requireService("upload");
    await upload.uploadFile(file);
  }

  private handleError(error: Error): void {
    const logger = this.requireService("logger");
    logger.error("命令执行失败:", error);
    process.exit(1);
  }
}
```

### 使用 onError 钩子

```typescript
export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .argument("<file>", "文件路径")
      .action(async (file: string) => {
        const upload = this.requireService("upload");
        await upload.uploadFile(file);
      });
  }

  public onError(error: Error): void {
    const logger = this.getService("logger");
    
    if (logger) {
      logger.error("上传失败:", error);
    } else {
      console.error("上传失败:", error);
    }
    
    // 根据错误类型返回不同的退出码
    if (error.message.includes("not found")) {
      process.exit(2);
    } else if (error.message.includes("permission")) {
      process.exit(3);
    } else {
      process.exit(1);
    }
  }
}
```

### 用户友好的错误信息

```typescript
private async handleUpload(file: string): Promise<void> {
  const logger = this.requireService("logger");
  const upload = this.requireService("upload");

  try {
    await upload.uploadFile(file);
  } catch (error) {
    const err = error as Error;
    
    // 根据错误类型提供友好的提示
    if (err.message.includes("ENOENT")) {
      logger.error(`文件不存在: ${file}`);
      logger.info("请检查文件路径是否正确");
    } else if (err.message.includes("configuration")) {
      logger.error("OSS 配置未设置");
      logger.info("请先运行: fast init");
    } else if (err.message.includes("network")) {
      logger.error("网络连接失败");
      logger.info("请检查网络连接并重试");
    } else {
      logger.error("上传失败:", err.message);
    }
    
    process.exit(1);
  }
}
```

---

## 最佳实践

### 1. 命令结构

**好的做法** ✅:
```typescript
export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .description("上传文件")
      .argument("<file>", "文件路径")
      .action(async (file: string, options) => {
        await this.execute(file, options);
      });
  }

  // 将逻辑分离到私有方法
  private async execute(file: string, options: any): Promise<void> {
    await this.validateFile(file);
    await this.uploadFile(file);
    this.showSuccess(file);
  }

  private async validateFile(file: string): Promise<void> {
    // 验证逻辑
  }

  private async uploadFile(file: string): Promise<void> {
    // 上传逻辑
  }

  private showSuccess(file: string): void {
    // 显示成功信息
  }
}
```

**不好的做法** ❌:
```typescript
export default class UploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("upload")
      .action(async (file: string) => {
        // 所有逻辑都在 action 中
        const logger = this.requireService("logger");
        const upload = this.requireService("upload");
        // ... 100 行代码
      });
  }
}
```

### 2. 输入验证

```typescript
export default class ConfigCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("config")
      .command("set")
      .argument("<key>", "配置键")
      .argument("<value>", "配置值")
      .action(async (key: string, value: string) => {
        await this.setConfig(key, value);
      });
  }

  private async setConfig(key: string, value: string): Promise<void> {
    const logger = this.requireService("logger");

    // 验证输入
    if (!key || key.trim() === "") {
      logger.error("配置键不能为空");
      process.exit(1);
    }

    if (!value || value.trim() === "") {
      logger.error("配置值不能为空");
      process.exit(1);
    }

    // 验证键名格式
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
      logger.error("配置键只能包含字母、数字、点、下划线和连字符");
      process.exit(1);
    }

    // 执行设置
    const config = this.requireService("config");
    config.set(key, value);
    logger.info(`配置已设置: ${key} = ${value}`);
  }
}
```

### 3. 进度反馈

```typescript
export default class BatchUploadCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("batch-upload")
      .argument("<pattern>", "文件模式")
      .action(async (pattern: string) => {
        await this.batchUpload(pattern);
      });
  }

  private async batchUpload(pattern: string): Promise<void> {
    const logger = this.requireService("logger");
    const upload = this.requireService("upload");
    const glob = require("glob");

    const files = glob.sync(pattern);
    
    if (files.length === 0) {
      logger.warn(`没有找到匹配的文件: ${pattern}`);
      return;
    }

    logger.info(`找到 ${files.length} 个文件`);

    // 显示进度
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      logger.info(`[${i + 1}/${files.length}] 上传: ${file}`);
      
      try {
        await upload.uploadFile(file);
        logger.info(`✓ 成功`);
      } catch (error) {
        logger.error(`✗ 失败: ${(error as Error).message}`);
      }
    }

    logger.info("批量上传完成");
  }
}
```

### 4. 交互式命令

```typescript
import inquirer from "inquirer";

export default class InitCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("init")
      .description("初始化配置")
      .action(async () => {
        await this.init();
      });
  }

  private async init(): Promise<void> {
    const logger = this.requireService("logger");
    const config = this.requireService("config");

    logger.info("欢迎使用 Fast CLI！");
    logger.info("请配置 OSS 信息：\n");

    // 交互式输入
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "region",
        message: "Region:",
        default: "oss-cn-hangzhou",
      },
      {
        type: "input",
        name: "apiKey",
        message: "API Key:",
        validate: (input) => input.length > 0 || "API Key 不能为空",
      },
      {
        type: "password",
        name: "apiKeySecret",
        message: "API Key Secret:",
        validate: (input) => input.length > 0 || "API Key Secret 不能为空",
      },
      {
        type: "input",
        name: "bucket",
        message: "Bucket:",
        validate: (input) => input.length > 0 || "Bucket 不能为空",
      },
      {
        type: "input",
        name: "domain",
        message: "自定义域名 (可选):",
      },
    ]);

    // 保存配置
    config.set("cloud", {
      oss: {
        region: answers.region,
        apiKey: answers.apiKey,
        apiKeySecret: answers.apiKeySecret,
        bucket: answers.bucket,
        domain: answers.domain || undefined,
      },
    });

    logger.info("\n✓ 配置已保存");
  }
}
```

---

## 常见模式

### 模式 1: 子命令

```typescript
export default class DatabaseCommand extends CommandBase {
  public onEnable(): void {
    // 主命令
    this.program
      .name("db")
      .description("数据库管理");

    // 子命令: migrate
    this.program
      .command("migrate")
      .description("运行数据库迁移")
      .action(async () => {
        await this.migrate();
      });

    // 子命令: seed
    this.program
      .command("seed")
      .description("填充种子数据")
      .action(async () => {
        await this.seed();
      });

    // 子命令: reset
    this.program
      .command("reset")
      .description("重置数据库")
      .option("--force", "强制重置")
      .action(async (options) => {
        await this.reset(options.force);
      });
  }

  private async migrate(): Promise<void> {
    const logger = this.requireService("logger");
    logger.info("运行数据库迁移...");
    // 迁移逻辑
  }

  private async seed(): Promise<void> {
    const logger = this.requireService("logger");
    logger.info("填充种子数据...");
    // 填充逻辑
  }

  private async reset(force: boolean): Promise<void> {
    const logger = this.requireService("logger");
    
    if (!force) {
      logger.warn("这将删除所有数据！");
      logger.info("使用 --force 选项确认");
      return;
    }
    
    logger.info("重置数据库...");
    // 重置逻辑
  }
}
```

### 模式 2: CRUD 命令

```typescript
export default class UserCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("user")
      .description("用户管理");

    // Create
    this.program
      .command("create")
      .description("创建用户")
      .requiredOption("-n, --name <name>", "用户名")
      .requiredOption("-e, --email <email>", "邮箱")
      .action(async (options) => {
        await this.createUser(options);
      });

    // Read
    this.program
      .command("get")
      .description("获取用户")
      .argument("<id>", "用户ID")
      .action(async (id: string) => {
        await this.getUser(id);
      });

    // Update
    this.program
      .command("update")
      .description("更新用户")
      .argument("<id>", "用户ID")
      .option("-n, --name <name>", "新用户名")
      .option("-e, --email <email>", "新邮箱")
      .action(async (id: string, options) => {
        await this.updateUser(id, options);
      });

    // Delete
    this.program
      .command("delete")
      .description("删除用户")
      .argument("<id>", "用户ID")
      .option("--force", "强制删除")
      .action(async (id: string, options) => {
        await this.deleteUser(id, options.force);
      });

    // List
    this.program
      .command("list")
      .description("列出用户")
      .option("-l, --limit <number>", "限制数量", "10")
      .option("-o, --offset <number>", "偏移量", "0")
      .action(async (options) => {
        await this.listUsers(options);
      });
  }

  private async createUser(options: any): Promise<void> {
    // 创建逻辑
  }

  private async getUser(id: string): Promise<void> {
    // 获取逻辑
  }

  private async updateUser(id: string, options: any): Promise<void> {
    // 更新逻辑
  }

  private async deleteUser(id: string, force: boolean): Promise<void> {
    // 删除逻辑
  }

  private async listUsers(options: any): Promise<void> {
    // 列表逻辑
  }
}
```

### 模式 3: 管道命令

```typescript
export default class ProcessCommand extends CommandBase {
  public onEnable(): void {
    this.program
      .name("process")
      .description("处理文件")
      .argument("<input>", "输入文件")
      .option("-o, --output <file>", "输出文件")
      .option("-f, --format <format>", "输出格式", "json")
      .action(async (input: string, options) => {
        await this.process(input, options);
      });
  }

  private async process(input: string, options: any): Promise<void> {
    const logger = this.requireService("logger");
    const fs = require("fs");

    // 读取输入
    logger.info(`读取文件: ${input}`);
    const data = await fs.promises.readFile(input, "utf-8");

    // 处理数据
    logger.info("处理数据...");
    const processed = this.transform(data, options.format);

    // 输出结果
    if (options.output) {
      await fs.promises.writeFile(options.output, processed);
      logger.info(`结果已保存到: ${options.output}`);
    } else {
      console.log(processed);
    }
  }

  private transform(data: string, format: string): string {
    // 转换逻辑
    return data;
  }
}
```

---

## 测试命令

### 单元测试

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import UploadCommand from "./UploadCommand";
import Kernel from "@core/Kernel";

describe("UploadCommand", () => {
  let kernel: Kernel;
  let command: UploadCommand;

  beforeEach(() => {
    kernel = new Kernel();
    command = new UploadCommand(kernel);
  });

  it("should create command with correct name", () => {
    command.onEnable();
    expect(command.program.name()).toBe("upload");
  });

  it("should have description", () => {
    command.onEnable();
    expect(command.program.description()).toBeTruthy();
  });
});
```

### 集成测试

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Kernel from "@core/Kernel";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("UploadCommand Integration", () => {
  beforeAll(async () => {
    // 构建项目
    await execAsync("npm run build");
  });

  it("should show help", async () => {
    const { stdout } = await execAsync("node dist/index.js upload --help");
    expect(stdout).toContain("上传文件");
  });

  it("should upload file", async () => {
    const { stdout } = await execAsync("node dist/index.js upload test.txt");
    expect(stdout).toContain("上传成功");
  });
});
```

---

## 总结

开发命令的关键点：

1. **继承 CommandBase 基类**
2. **实现 onEnable() 方法**
3. **使用 Commander.js API 配置命令**
4. **合理使用参数和选项**
5. **访问服务完成业务逻辑**
6. **提供友好的错误处理**
7. **遵循最佳实践**
8. **编写测试**

通过遵循这些指南，你可以开发出用户友好、功能强大的 CLI 命令。