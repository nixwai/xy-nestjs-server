# 景区导游预约平台后端

基于 NestJS 的模块化单体后端，为微信小程序和 SoybeanAdmin 管理后台提供 REST API。

当前项目已具备认证、管理员、角色、权限、审计、健康检查和统一配置基础能力；景区、导游、场次、预约、通知、媒体及商城模块目前仅保留模块边界，不包含未经确认的业务实现。

## Description

项目定位为景区导游预约平台的后端基础工程，主要负责：

- 提供统一的 REST API 和响应结构；
- 提供管理员登录、Refresh Token 轮换和会话撤销；
- 提供管理员、角色、权限和 RBAC 授权能力；
- 提供操作审计和健康检查接口；
- 通过 TypeORM 管理 MySQL 数据库；
- 为后续景区、导游、讲解场次和预约业务保留模块边界。

## Project setup

技术栈：

- Node.js 24
- pnpm 11
- NestJS 12
- TypeScript 6
- TypeORM + MySQL 8
- Vitest + Supertest
- Docker + CloudBase 云托管

安装依赖：

```bash
pnpm install --frozen-lockfile
```

准备开发环境变量。应用读取 `.env.development.local`，Docker Compose 默认读取项目根目录的 `.env`：

Windows PowerShell：

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.development.local
```

macOS/Linux：

```bash
cp .env.example .env
cp .env.example .env.development.local
```

请至少修改以下配置：

- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGINS`

启动本地 MySQL：

```bash
docker compose up -d mysql
```

## Compile and run

```bash
# development
pnpm start

# watch mode
pnpm start:dev

# debug mode
pnpm start:debug

# production build
pnpm build

# production mode
pnpm start:prod
```

启动前会自动加载环境变量并执行配置校验。生产环境不读取 `.env.production`，必须通过运行时环境变量提供生产配置。

## Run tests

```bash
# type check
pnpm typecheck

# lint
pnpm lint

# formatting check
pnpm format:check

# unit tests
pnpm test

# watch unit tests
pnpm test:watch

# end-to-end tests
pnpm test:e2e

# coverage
pnpm test:cov
```

测试环境使用 `.env.test.local` 或 `.env.test`，并强制关闭真实数据库连接。

一次执行完整验证：

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
pnpm openapi:generate
```

## Database

数据库使用 MySQL 8，生产环境通过 TypeORM Migration 管理结构，禁止使用 `synchronize` 自动修改生产表结构。

常用迁移命令：

```bash
# 查看迁移状态
pnpm migration:show

# 执行待执行迁移
pnpm migration:run

# 回滚最近一次迁移，仅建议在本地开发环境使用
pnpm migration:revert

# 根据实体生成迁移草稿
pnpm migration:generate
```

当前主要数据表包括：

- `admins`：管理员账户；
- `admin_sessions`：Refresh Token 会话；
- `roles`：角色；
- `permissions`：权限目录；
- `admin_roles`：管理员与角色的显式关联表；
- `role_permissions`：角色与权限的显式关联表；
- `audit_logs`：操作审计记录。

管理员和角色使用 `deletedAt` 记录软删除时间。`admin_roles` 和 `role_permissions` 使用显式中间表维护多对多关系，关联字段保留业务 ID，由应用层事务校验和维护，不使用数据库外键或级联约束。关联关系解除时删除关系记录，不物理删除业务主体。

## API

默认全局前缀为 `/api`。

### Health

```text
GET /api/health
GET /api/health/ready
```

健康检查接口不要求 API 版本头。

### Authentication

```text
POST /api/auth/admin/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Admin

```text
GET  /api/admin/me
GET  /api/admin/list
POST /api/admin/create
POST /api/admin/update
POST /api/admin/soft-delete
POST /api/admin/role-bind
POST /api/admin/role-unbind
```

### Role

```text
GET  /api/role/list
POST /api/role/create
POST /api/role/update
POST /api/role/soft-delete
POST /api/role/permission-bind
POST /api/role/permission-unbind
```

### Permission and audit

```text
GET  /api/permission/list
POST /api/permission/enable
POST /api/permission/disable
GET  /api/audit/list
```

业务接口必须携带：

```http
Accept: application/vnd.scenic.v1+json
```

Swagger 文档默认地址：

```text
/api/docs
```

Swagger 是否启用以及访问路径由 `SWAGGER_ENABLED` 和 `config/config.yaml` 配置。

OpenAPI 文档生成：

```bash
pnpm openapi:generate
```

生成文件为项目根目录的 `openapi.json`，该文件属于构建产物，不提交到 Git。

## Deployment

### Docker

构建镜像：

```bash
docker build -t yue-server .
```

运行容器时必须注入生产环境变量：

```bash
docker run --env-file .env \
  -p 3000:3000 \
  yue-server
```

生产环境至少需要配置：

```text
NODE_ENV=production
PORT
DB_ENABLED=true
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_DATABASE
JWT_SECRET
```

启用 COS 或微信能力时，还必须分别提供对应的完整凭据。

### CloudBase

生产部署使用 CloudBase 云托管。生产环境不依赖仓库中的环境文件，数据库、JWT、COS 和微信配置必须通过 CloudBase 运行时环境变量注入。

部署前请确认：

- 数据库迁移已执行；
- `synchronize` 保持为 `false`；
- JWT 密钥不是占位值或测试值；
- COS 和微信开关与凭据配置一致；
- `/api/health/ready` 返回依赖就绪状态。

## Project structure

```text
src/
├── common/                 # 响应、异常、守卫、拦截器、工具和公共类型
├── config/                 # 环境加载、配置映射和 Joi 校验
├── database/               # TypeORM Migration
├── modules/                # 领域模块
│   ├── admin/              # 管理员及管理员角色关系
│   ├── auth/               # 登录、Token 和会话
│   ├── authorization/      # RBAC 授权
│   ├── audit/              # 操作审计
│   ├── permission/         # 权限目录
│   ├── role/               # 角色及角色权限关系
│   ├── health/             # 健康检查
│   ├── attraction/         # 景点模块边界
│   ├── guide/              # 导游模块边界
│   ├── guide-session/      # 讲解场次模块边界
│   ├── booking/            # 预约模块边界
│   ├── notification/       # 通知模块边界
│   ├── media/              # 媒体模块边界
│   ├── site/               # 景区模块边界
│   ├── storage/            # 存储模块边界
│   └── task/                # 任务模块边界
├── shared/                 # 全局基础设施
└── main.ts                 # 应用启动入口

scripts/                    # OpenAPI 生成和管理员初始化脚本
test/unit/                  # 单元测试
test/e2e/                   # E2E 测试
test/setup.ts               # 测试初始化
config/config.yaml          # 唯一 YAML 配置模板
docker-compose.yml          # 本地 MySQL
Dockerfile                  # 生产镜像构建文件
docs/                       # 架构、配置、决策和待确认事项
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Docker Documentation](https://docs.docker.com)
- [腾讯云 CloudBase 文档](https://cloud.tencent.com/document/product/876)

项目内部文档：

- `docs/architecture.md`：系统边界和模块化单体架构；
- `docs/configuration.md`：配置来源、加载流程和校验规则；
- `docs/decisions.md`：已确定的技术决策；
- `docs/pending-decisions.md`：尚未确认的业务规则。

## Support

当前项目为内部业务基础工程。新增业务模块、数据库字段、状态规则或外部服务接入前，应先确认需求和领域边界，并同步更新对应的模块、迁移、测试和文档。

## Stay in touch

项目维护信息和协作约定以仓库内以下文件为准：

- `AGENTS.md`：项目开发和 Agent 协作规范；
- `.agents/skills/`：项目专属开发 Skill；
- `.github/workflows/ci.yml`：持续集成验证流程。

## License

本项目当前为内部私有项目，许可证标记为 `UNLICENSED`。
