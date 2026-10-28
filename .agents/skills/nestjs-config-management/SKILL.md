---
name: nestjs-config-management
description: 管理本项目 NestJS 配置、环境变量、Joi 校验和 TypeORM CLI 数据源。仅适用于配置加载、环境文件、配置校验或数据库连接配置任务。
---

# 配置管理规范

## 配置来源

- 仓库内唯一 YAML 配置模板是 `config/config.yaml`。
- `src/config/environment.ts` 统一解析环境变量文件：`development` 使用 `.env.development.local`、`.env.development`、`.env`；`test` 使用 `.env.test.local`、`.env.test`；`production` 不读取环境文件。
- 运行时环境变量优先于环境文件和 YAML 配置。
- 不创建或依赖环境专用 YAML 文件。
- `.env.example` 是环境变量模板，真实环境文件不得提交。

## 配置处理入口

- `src/common/utils/config.util.ts`：读取 `config/config.yaml`，递归合并对象，数组和标量由覆盖值替换。
- `src/config/configuration.ts`：加载基础配置、映射环境变量、构建分组配置并执行校验。
- `src/config/config.types.ts`：定义 `ApplicationConfig` 及各分组类型。
- `src/config/config.constants.ts`：定义 `ConfigService` 配置键常量。
- `src/config/config.validation.ts`：定义环境变量和最终配置的 Joi 校验。
- `src/data-source.ts`：为 TypeORM CLI 独立构建数据源，不依赖 NestJS DI。

业务代码通过注入 `ConfigService` 读取配置，不直接读取 `process.env`。新增配置必须同步更新配置类型、基础 YAML、环境变量映射和 Joi 校验。

## 配置分组

当前分组为 `app`、`cors`、`database`、`jwt`、`swagger`、`storage`、`wechat`、`throttler` 和 `api`。分别承载应用、CORS、MySQL、JWT、Swagger、COS、微信、限流及 API 版本头配置。

## 数据库

- 运行时和 TypeORM CLI 均使用 MySQL；`synchronize` 必须为 `false`。
- `SharedModule` 根据最终配置决定是否加载数据库模块。
- 测试环境不建立真实数据库连接，不得绕过该隔离。
- 数据库结构变更使用 `src/database/migrations/` 中的 TypeORM Migration。

## 安全约束

- 配置文件只允许空值、占位符或测试值，不得提交生产密钥、数据库密码、COS 凭据、微信 AppSecret 或 JWT 密钥。
- `JWT_SECRET` 必须通过校验；生产环境拒绝占位或测试密钥。
- COS 或微信开关启用时，必须校验完整凭据。
- 禁止新增隐式配置来源、静默默认密钥或绕过 `buildApplicationConfig()` 的读取路径。
