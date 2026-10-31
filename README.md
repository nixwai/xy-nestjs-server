# 景区导游预约平台后端

基于 NestJS 的模块化单体后端，为微信小程序和 SoybeanAdmin 管理后台提供 REST API。

当前项目已具备管理员认证、Refresh Token 会话、管理员账户、角色、权限、RBAC 授权、操作审计、健康检查和统一配置基础能力；景区、景点、导游、讲解场次、预约、通知、媒体、对象存储和任务模块目前仅保留模块边界，不包含未经确认的业务实现。

## 技术栈

| 组件 | 说明 |
|------|------|
| Node.js 24 | 运行时 |
| pnpm 11 | 包管理器，项目声明版本为 `pnpm@11.20.0` |
| NestJS 12 | HTTP 应用框架 |
| TypeScript 6 | 开发语言，使用 NodeNext ESM |
| TypeORM | ORM 和数据库迁移工具 |
| MySQL 8 | 生产和开发数据库 |
| Vitest + Supertest | 单元测试和 HTTP 测试 |
| Docker / Docker Compose | 本地数据库和生产镜像 |
| CloudBase 云托管 | 生产运行环境 |
| Swagger / OpenAPI 3 | API 文档和接口契约 |

## 快速开始

### 前置条件

- Node.js 24+
- pnpm 11+
- Docker 和 Docker Compose
- MySQL 8+（也可以使用项目提供的 Docker Compose）

### 1. 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 2. 准备环境变量

开发环境按以下优先级读取环境文件：

```text
.env.development.local → .env.development → .env
```

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

至少需要修改：

- `DB_PASSWORD`：本地 MySQL 密码；
- `JWT_SECRET`：不少于 32 个字符的随机密钥；
- `CORS_ORIGINS`：允许访问 API 的前端来源。

启用腾讯云 COS 或微信能力时，还需要填写对应的完整配置。真实密码、密钥、连接信息和 AppSecret 禁止提交到仓库。

### 3. 启动本地 MySQL

```bash
docker compose up -d mysql
```

查看数据库容器状态：

```bash
docker compose ps
```

停止数据库：

```bash
docker compose stop mysql
```

删除容器和数据卷前请确认不再需要本地数据：

```bash
docker compose down -v
```

### 4. 执行数据库迁移

```bash
# 查看迁移状态
pnpm migration:show

# 执行待执行迁移
pnpm migration:run
```

数据库结构由 TypeORM Migration 管理，生产环境禁止使用 `synchronize` 自动修改表结构。

### 5. 初始化首个管理员

数据库迁移完成后执行：

```bash
pnpm admin:init
```

脚本会交互式读取管理员用户名和密码，并幂等初始化超级管理员、默认角色及权限目录。密码必须为 8-72 位，并同时包含字母和数字。

### 6. 启动 HTTP 服务

```bash
# 普通启动
pnpm start

# 开发监听模式
pnpm start:dev

# 调试监听模式
pnpm start:debug
```

默认监听端口为 `3000`，全局 API 前缀为 `/api`。

## 项目结构

```text
src/
├── common/                 # 响应、异常、守卫、拦截器、管道、工具和公共类型
├── config/                 # 环境加载、配置映射和 Joi 校验
├── database/               # TypeORM Migration
├── modules/                # 领域模块
│   ├── admin/              # 管理员账户和管理员角色关系
│   ├── auth/               # 管理员登录、Token 和会话
│   ├── authorization/      # RBAC 授权
│   ├── audit/              # 操作审计
│   ├── permission/         # 权限目录
│   ├── role/               # 角色和角色权限关系
│   ├── health/             # 存活和就绪检查
│   ├── site/               # 景区模块边界
│   ├── attraction/         # 景点模块边界
│   ├── guide/              # 导游模块边界
│   ├── guide-session/      # 讲解场次模块边界
│   ├── booking/            # 预约模块边界
│   ├── notification/       # 通知模块边界
│   ├── media/              # 媒体模块边界
│   ├── storage/            # 对象存储模块边界
│   ├── task/               # 任务模块边界
│   └── user/               # 用户模块边界
├── shared/                 # 全局基础设施，目前包含数据库模块
└── main.ts                 # 应用启动入口

config/config.yaml          # 仓库内唯一 YAML 配置模板
docs/                       # 架构、配置、决策和待确认事项
scripts/                    # OpenAPI 生成和管理员初始化脚本
test/unit/                  # 单元测试
test/e2e/                   # 端到端测试
test/setup.ts               # 测试初始化
docker-compose.yml          # 本地 MySQL 服务
Dockerfile                  # 生产镜像构建文件
```

## 分层架构

项目采用模块化单体结构：

```text
HTTP Controller
    ↓
Application Service
    ↓
Repository Port / Domain Error
    ↓
TypeORM Repository
    ↓
MySQL
```

- `src/modules` 负责领域边界，领域模块通过公开服务或接口协作；
- `src/common` 负责统一响应、异常、API 版本校验、限流、参数校验和横切工具；
- `src/config` 负责环境文件、运行时变量、YAML 配置和 Joi 校验；
- `src/shared/database` 负责数据库基础设施；
- 数据访问通过 Repository Port 隔离，业务逻辑不直接依赖具体存储实现；
- 多对多关系使用显式关系表，关系完整性由应用服务在事务边界内维护；
- 未确认的预约取消、改期、容量、手机号、通知模板和媒体约束不得在代码中自行固化。

## API

默认全局前缀为 `/api`。

### 健康检查

```text
GET /api/health
GET /api/health/ready
```

- `/api/health`：返回进程存活状态和当前运行环境；
- `/api/health/ready`：检查应用及数据库依赖是否就绪；
- 健康检查接口不要求 API 版本头。

### 认证

```text
POST /api/auth/admin/login
POST /api/auth/refresh
POST /api/auth/logout
```

### 管理员

```text
GET  /api/admin/me
GET  /api/admin/list
POST /api/admin/create
POST /api/admin/update
POST /api/admin/soft-delete
POST /api/admin/role-bind
POST /api/admin/role-unbind
```

### 角色和权限

```text
GET  /api/role/list
POST /api/role/create
POST /api/role/update
POST /api/role/soft-delete
POST /api/role/permission-bind
POST /api/role/permission-unbind
GET  /api/permission/list
POST /api/permission/enable
POST /api/permission/disable
```

### 审计

```text
GET /api/audit/list
```

### API 版本头

除健康检查和 Swagger 文档外，业务接口必须携带：

```http
Accept: application/vnd.scenic.v1+json
```

所有请求还会经过全局参数校验、进程内客户端 IP 限流、JWT 认证和 RBAC 授权流程；公开接口按现有控制器声明豁免认证或授权。

## 响应格式

成功响应统一为：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

无业务数据时，`data` 为 `null`。列表接口通常返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 0
  }
}
```

客户端可见的业务异常统一返回 `code`、`message` 和 `data: null`。未预期的服务端异常返回统一的服务器错误，不向客户端暴露内部异常细节。

## 配置说明

### 配置来源和优先级

仓库内只保留一个 YAML 配置模板：

```text
config/config.yaml
```

配置加载流程为：

```text
加载环境文件
→ 读取 config/config.yaml
→ 显式映射运行时环境变量
→ 类型转换
→ Joi 校验
→ 注入 ConfigService
```

运行时环境变量优先于环境文件和 YAML 配置。

环境文件规则：

```text
development:
  .env.development.local → .env.development → .env

test:
  .env.test.local → .env.test

production:
  不读取环境文件，只读取 CloudBase 或容器注入的运行时环境变量
```

### 主要环境变量

| 变量 | 说明 |
|------|------|
| `NODE_ENV` | `development`、`test` 或 `production` |
| `PORT` / `APP_PORT` | HTTP 服务端口 |
| `CORS_ORIGINS` | 逗号分隔的 CORS 来源列表 |
| `DB_ENABLED` | 是否启用 MySQL |
| `DB_HOST` / `DB_PORT` | MySQL 地址和端口 |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | MySQL 连接凭据和数据库名 |
| `JWT_SECRET` | JWT 签名密钥，至少 32 个字符 |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access Token 有效期，默认 `15m` |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh Token 有效期，默认 `7d` |
| `SWAGGER_ENABLED` | 是否启用 Swagger UI |
| `STORAGE_ENABLED` | 是否启用腾讯云 COS |
| `COS_REGION` / `COS_BUCKET` | COS 地域和存储桶 |
| `COS_SECRET_ID` / `COS_SECRET_KEY` | COS 访问凭据 |
| `WECHAT_ENABLED` | 是否启用微信能力 |
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` | 微信小程序凭据 |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | 限流窗口和窗口内请求上限 |

配置校验约束：

- 数据库启用时必须提供完整连接配置；
- `synchronize` 永远为 `false`；
- 测试环境强制关闭真实数据库连接；
- 启用 COS 或微信能力时必须提供对应的完整凭据；
- 生产环境拒绝占位、示例或测试 JWT 密钥。

## API 文档

### Swagger UI

开发环境默认启用 Swagger，地址为：

```text
http://localhost:3000/api/docs
```

Swagger 是否启用由 `SWAGGER_ENABLED` 控制，文档路径由 `config/config.yaml` 中的 `swagger.path` 控制。

### 生成 OpenAPI 文件

```bash
pnpm openapi:generate
```

命令使用测试环境配置生成项目根目录下的 `openapi.json`。该文件属于生成产物，已被 `.gitignore` 忽略。

## 数据库

TypeORM 使用 MySQL、`utf8mb4` 和 `SnakeNamingStrategy`。数据库结构统一通过 `src/database/migrations/` 中的迁移文件管理。

当前迁移覆盖：

- `admin`：管理员账户；
- `admin_session`：Refresh Token 会话；
- `role`：角色；
- `permission`：权限目录；
- `admin_role_assignment`：管理员与角色关系；
- `role_permission_assignment`：角色与权限关系；
- `audit_log`：管理员操作审计。

常用命令：

```bash
# 查看迁移状态
pnpm migration:show

# 执行待执行迁移
pnpm migration:run

# 回滚最近一次迁移，仅建议在本地开发环境使用
pnpm migration:revert

# 生成迁移草稿；执行前请确认实体变更和输出路径
pnpm migration:generate
```

业务实体默认使用软删除语义；数据库不依赖外键和级联约束，关联关系由应用层校验和维护。

## 测试与校验

### 单元测试和 E2E 测试

```bash
# 类型检查
pnpm typecheck

# Lint
pnpm lint

# 格式检查
pnpm format:check

# 单元测试
pnpm test

# 监听模式
pnpm test:watch

# E2E 测试
pnpm test:e2e

# 覆盖率
pnpm test:cov
```

测试环境使用 `.env.test.local` 或 `.env.test`，不回退读取开发环境配置，并强制关闭真实数据库连接。

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

持续集成流程位于 `.github/workflows/ci.yml`，会执行类型检查、Lint、格式检查、单元测试、E2E 测试、构建和 OpenAPI 生成。

## Docker 部署

### 构建生产镜像

```bash
docker build -t yue-server .
```

### 运行生产容器

Dockerfile 只构建并运行应用容器，MySQL 应由独立数据库服务提供。运行时必须注入生产环境变量：

```bash
docker run --env-file .env.production \\
  -p 3000:3000 \\
  yue-server
```

生产环境不读取 `.env.production` 文件；上面的 `--env-file` 仅表示由 Docker 将变量注入进程。生产部署时也可以使用 CloudBase 的运行时环境变量注入，不应将生产环境文件复制进镜像。

至少需要配置：

```text
NODE_ENV=production
PORT=3000
DB_ENABLED=true
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_DATABASE
JWT_SECRET
```

启用 COS 或微信能力时，还必须提供对应的完整凭据。

## CloudBase 云托管

生产环境使用 CloudBase 云托管时，必须通过运行时环境变量提供配置，生产进程不依赖仓库中的环境文件。

部署前确认：

- 数据库已创建并完成 TypeORM 迁移；
- `synchronize` 保持为 `false`；
- `JWT_SECRET` 不是占位值、示例值或测试值；
- COS 和微信开关与凭据配置一致；
- 应用监听 `PORT` 指定的端口；
- `/api/health/ready` 返回数据库就绪状态。

## 安全要点

- 禁止提交真实数据库密码、JWT 密钥、COS 密钥、微信 AppSecret 和生产连接串；
- 所有外部请求参数必须经过 DTO 和全局校验管道验证；
- 管理员密码使用带随机盐的密码哈希保存，不保存明文密码；
- Refresh Token 通过会话记录管理，支持轮换和撤销；
- 管理员、角色和权限接口使用 JWT、RBAC 和超级管理员边界保护；
- 生产数据库禁止使用 TypeORM `synchronize`；
- 应用启用 Helmet，并对请求执行进程内 IP 限流；
- 错误响应不得泄露数据库、密钥或内部异常堆栈信息；
- 新增业务能力前必须确认领域规则，不得根据模块名称自行创建伪业务接口。

## 开发流程

1. 明确接口契约、业务规则、数据模型和安全边界；
2. 先更新 OpenAPI 或相关接口文档；
3. 先编写失败测试，再实现最小可行代码；
4. 使用 TypeORM Migration 管理数据库变更；
5. 执行类型检查、Lint、格式检查、单元测试、E2E 测试和构建；
6. 涉及 API 时执行 `pnpm openapi:generate`；
7. 检查 `git diff`、`git diff --check` 和敏感信息；
8. 同步更新受影响的项目文档和开发约定。

## 相关文档

- [AGENTS.md](AGENTS.md) — 项目开发规范和协作约定；
- [docs/architecture.md](docs/architecture.md) — 系统边界和模块化单体架构；
- [docs/configuration.md](docs/configuration.md) — 配置来源、加载流程和校验规则；
- [docs/decisions.md](docs/decisions.md) — 已确定的技术决策；
- [docs/pending-decisions.md](docs/pending-decisions.md) — 尚未确认的业务规则；
- [.env.example](.env.example) — 环境变量模板；
- [openapi.json](openapi.json) — 本地生成的 OpenAPI 文件，不纳入 Git 版本控制。

## 许可证

本项目当前为内部私有项目，许可证标记为 `UNLICENSED`。
