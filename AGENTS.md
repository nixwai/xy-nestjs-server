# 项目 Agent 规范

## 项目定位

本项目是景区导游预约平台后端，采用 NestJS 模块化单体，为微信小程序和 SoybeanAdmin 管理后台提供 REST API。

## 技术栈

- NestJS 12、TypeScript、Node.js 24、pnpm
- TypeORM + MySQL，生产使用 CloudBase MySQL
- 腾讯云 COS 通过 storage 模块抽象
- Vitest + Supertest；Vitest 是本项目对需求文档 Jest 方案的正式替代
- Docker + CloudBase 云托管

## 目录约定

- `src/common`：横切能力
- `src/config`：配置类型、加载和校验
- `src/database`：迁移
- `src/modules`：领域模块
- `src/shared`：全局基础设施
- `config/config.yaml`：唯一 YAML 配置模板
- `test`：E2E 测试
- `.agents/skills`：项目 Skill

## 配置规则

配置加载顺序为环境文件、唯一基础 YAML、显式环境变量映射和 Joi 校验。开发环境按 `.env.development.local`、`.env.development`、`.env` 加载；测试环境只读取 `.env.test.local`、`.env.test`；生产只读取 CloudBase 运行时环境变量，运行时变量始终优先。生产密钥、数据库密码、COS 密钥、微信 AppSecret 和 JWT 密钥禁止写入仓库。生产和开发启用数据库时必须连接 MySQL；测试环境禁止连接真实数据库。生产禁止 TypeORM `synchronize`。

## API 规则

业务接口必须携带 `Accept: application/vnd.scenic.v1+json`。健康检查和 Swagger 豁免版本头。成功响应使用 `{ code: 0, message: 'success', data }`；客户端业务错误使用统一业务 code，服务端错误不得泄露内部细节。

## 模块边界

领域模块只通过公开服务或接口协作。未确认的预约取消、改期、容量口径、手机号、通知模板、媒体约束等业务规则不得自行固化。商城仅预留，不创建业务代码。

## 开发命令

```bash
pnpm install --frozen-lockfile
pnpm start:dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm openapi:generate
```

## 安全与质量

- 不硬编码凭据。
- 边界输入必须校验。
- 优先不可变数据处理。
- 不添加伪实现和无依据接口。
- 修改代码后执行类型检查、Lint、测试和构建。
- 提交前检查 `git diff --check`、敏感信息和无关文件。
