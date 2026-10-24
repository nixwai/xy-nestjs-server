---
name: scenic-config-management
description: 在景区导游预约平台中新增、修改或排查配置加载、环境变量、Joi 校验和运行时配置时使用；不适用于与本项目无关的配置系统。
---

# 景区预约平台配置管理规范

## 适用范围

处理 `config/config.yaml`、`.env*`、`src/config/`、NestJS `ConfigModule`、TypeORM CLI、测试和 OpenAPI 生成脚本的配置时，必须遵循本 Skill。

## 配置来源与优先级

- `config/config.yaml` 是仓库内唯一 YAML 配置模板，只保存稳定默认值、分组结构和基础策略。
- 不新增 `config/config.production.yaml`、`config/config.development.yaml` 等环境专用 YAML 文件。
- 开发环境按 `.env.development.local`、`.env.development`、`.env` 加载，前者优先。
- 测试环境只读取 `.env.test.local`、`.env.test`，不得回退读取开发环境文件。
- 生产环境不读取环境文件，只使用 CloudBase 运行时环境变量。
- 运行时环境变量始终覆盖环境文件和 YAML 默认值。
- 应用、Vitest、TypeORM CLI 和 OpenAPI 生成必须使用同一套环境加载和配置构建逻辑。

## 配置代码

- 配置类型放在 `src/config/config.types.ts`，配置键常量放在 `src/config/config.constants.ts`，配置构建放在 `src/config/configuration.ts`，原始环境变量校验放在 `src/config/config.validation.ts`。
- 配置键常量使用 `as const`，并为每个键添加中文注释。
- NestJS 业务代码通过注入的 `ConfigService` 读取配置，不直接读取 `process.env`。
- 优先按配置分组读取完整对象，例如 `configService.getOrThrow<DatabaseConfig>('database')`；不要在业务代码中散落逐字段读取。
- TypeORM CLI 可通过 `src/data-source.ts` 独立构建数据源，但必须复用环境加载和配置构建入口。
- 新增配置必须同时更新类型、默认 YAML、环境变量模板、显式映射和 Joi 校验，并补充配置测试。

## 校验与失败行为

- 配置在应用启动边界进行 Joi 校验，非法值必须快速失败。
- 开发和生产启用数据库时必须具备可用的 MySQL 配置；测试环境禁止连接真实数据库。
- 生产环境必须显式提供数据库连接和生产密钥；缺失必需配置不得静默回退。
- 生产环境禁止 TypeORM `synchronize`，数据库结构变更必须使用 Migration。

## 安全

- 仓库中不得提交真实 JWT 密钥、数据库密码、COS 密钥、微信 AppSecret 或其他凭据。
- YAML 和环境模板只能使用空值、示例值或占位符，不得放入真实凭据。
- 任何新增配置都必须说明默认值、覆盖方式、校验规则和启动失败行为。
