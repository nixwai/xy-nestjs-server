# 项目 Agent 规范

## 开发前必读

开始任何开发、修改、重构、调试或代码审查前，必须：

1. 读取 `.agents/skills/` 下所有项目 Skill。
2. 根据当前任务匹配并遵循相关 Skill。
3. 若 Skill、项目事实和源码存在冲突，以本文件和实际源码为准；无法确认时不得猜测，必须先明确问题。
4. 新增或修改 Skill 后，检查本文件是否出现重复规则，并将详细规范放回对应 Skill。

## 项目定位

本项目是景区导游预约平台后端，采用 NestJS 模块化单体，为微信小程序和 SoybeanAdmin 管理后台提供 REST API。

## 技术栈

- NestJS 12、TypeScript、Node.js 24、pnpm
- TypeORM + MySQL，生产使用 CloudBase MySQL
- 腾讯云 COS 通过 storage 模块抽象
- Vitest + Supertest；Vitest 是本项目对需求文档 Jest 方案的正式替代
- Docker + CloudBase 云托管

## 项目事实

- 领域代码位于 `src/modules`，横切能力位于 `src/common`，配置位于 `src/config`，迁移位于 `src/database`，全局基础设施位于 `src/shared`。
- `config/config.yaml` 是仓库内唯一 YAML 配置模板。
- 单元测试位于 `test/unit`，E2E 测试位于 `test/e2e`，测试初始化位于 `test/setup.ts`。
- 业务接口统一使用统一响应格式；健康检查和 Swagger 按现有代码提供基础设施接口。
- 生产密钥、数据库密码、COS 密钥、微信 AppSecret 和 JWT 密钥禁止写入仓库。

## 领域边界

- 领域模块只通过公开服务或接口协作。
- 未确认的预约取消、改期、容量口径、手机号、通知模板、媒体约束等业务规则不得自行固化。
- 商城仅预留，不创建商城业务代码。
- 不复制 blogger-server 的博客领域代码，也不添加没有真实业务依据的 Entity、DTO、API 或伪实现。

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

## 交付要求

- 修改后执行与变更相关的类型检查、Lint、单元测试、E2E 测试和构建；涉及 API 时同步检查 OpenAPI。
- 提交前检查 `git diff --check`、敏感信息和无关文件。
