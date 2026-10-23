# 景区导游预约平台后端

## 基础能力

NestJS 模块化单体后端，提供景区导览、导游讲解场次和预约平台的 REST API 基础工程。

## 环境配置

复制示例配置并填写本地数据库和 JWT 密钥：

```bash
copy .env.example .env.development.local
pnpm install
pnpm start:dev
```

本地数据库：

```bash
docker compose up -d mysql
```

测试环境：

```bash
pnpm test
pnpm test:e2e
```

测试只读取 `.env.test`，并强制关闭真实数据库。生产环境不使用 `.env.production`，由 CloudBase 运行时环境变量注入配置。

## 配置加载顺序

```text
development: .env.development.local → .env.development → .env
test:        .env.test.local → .env.test
production:  仅运行时环境变量
```

运行时环境变量始终优先。所有配置在启动阶段通过 Joi 校验。

## 命令

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
pnpm openapi:generate
```

## API

- 存活检查：`GET /api/health`
- 就绪检查：`GET /api/health/ready`
- Swagger：开发环境访问 `/api/docs`
- 业务接口版本头：`Accept: application/vnd.scenic.v1+json`

## 目录

- `src/common`：响应、异常、校验、版本和安全横切能力
- `src/config`：环境加载、配置映射与校验
- `config/config.yaml`：唯一 YAML 配置模板
- `src/modules`：领域模块边界
- `src/shared/database`：TypeORM 运行时连接
- `src/database/migrations`：数据库迁移
- `.agents/skills/scenic-server-project`：项目专属 Agent Skill

## 业务边界

当前仅建立后端基础工程和领域边界，不实现预约、认证、内容、COS 等业务逻辑，不创建未确认的数据库字段和状态规则。商城模块仅预留，不创建代码。
