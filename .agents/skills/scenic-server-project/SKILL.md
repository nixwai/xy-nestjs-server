# Scenic Server Project Skill

## 适用场景

用于本项目的需求分析、NestJS 模块开发、配置修改、数据库迁移、API 横切能力和测试验证。

## 标准工作流

1. 阅读 `D:\Desktop\outputs` 中对应需求文档，区分已确认事实、待确认项和非范围。
2. 检查当前模块、配置、测试和 Git 状态。
3. 按领域边界实现，禁止把待确认规则写成默认业务规则。
4. 新增配置必须同步类型、唯一 YAML 模板、环境变量模板和校验测试。
5. 新增接口必须同步版本头、响应信封、Swagger 和测试。
6. TypeORM 结构变更只能通过 Migration。
7. 执行 typecheck、lint、unit、e2e、build 和 diff 检查。

## 结构约束

领域代码位于 `src/modules/<feature>`。横切能力放在 `src/common`。数据库连接放在 `src/shared/database`，CLI 数据源为 `src/data-source.ts`。业务模块不得直接依赖 COS SDK 或绕过 Repository 访问数据库。

## 配置约束

- `config/config.yaml` 是仓库内唯一 YAML 配置文件，只保存分组、稳定默认值和基础策略。
- 环境差异通过环境文件和运行时环境变量控制，不新增 `config/config.<environment>.yaml`。
- 开发环境读取 `.env.development.local`、`.env.development`、`.env`；测试环境只读取 `.env.test.local`、`.env.test`；生产只读取 CloudBase 运行时变量。
- 运行时环境变量优先于环境文件。
- 应用、Vitest、TypeORM CLI 和 OpenAPI 生成必须共用环境加载入口。
- 敏感配置只允许环境变量注入。业务模块不得直接读取 `process.env`。
- 测试环境必须关闭真实数据库连接。任何新增配置都必须明确默认值、环境覆盖、校验规则和启动失败行为。

## 常见风险

- 误把需求文档待确认项当成业务规则；
- 生产启用 `synchronize`；
- 测试连接开发或生产数据库；
- 测试错误回退读取开发 `.env`；
- 应用、Migration 和测试使用不同的环境变量优先级；
- 缺失 Accept 版本头校验；
- 直接暴露数据库、COS 或内部异常；
- 复制 blogger-server 的博客领域代码；
- 生成没有真实业务依据的 Entity、DTO 或 API。
