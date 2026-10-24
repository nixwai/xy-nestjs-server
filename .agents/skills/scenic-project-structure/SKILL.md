---
name: scenic-project-structure
description: 在景区导游预约平台中新增模块、Controller、Service、Entity、DTO、公共能力或数据库基础设施时使用；不用于改变既有项目分层而未先确认架构决策。
---

# 景区预约平台 NestJS 项目结构规范

## 目录职责

- `src/common`：跨模块横切能力，例如装饰器、枚举、过滤器、守卫、拦截器、管道、类型和纯工具。
- `src/config`：配置类型、环境加载、配置构建和校验。
- `src/database/migrations`：TypeORM 数据库迁移。
- `src/modules/<feature>`：领域模块。
- `src/shared`：全局基础设施，例如数据库模块。
- `config/config.yaml`：唯一 YAML 配置模板。
- `test/unit`、`test/e2e`：单元测试和端到端测试。

## 模块边界

- 新功能优先放入对应 `src/modules/<feature>`，横切能力不得复制到领域模块。
- 领域模块通过公开 Service 或接口协作，不直接访问其他模块的 Repository、内部文件或第三方 SDK。
- COS 访问必须经过 storage 模块抽象；数据库访问必须经过 TypeORM Repository 和模块公开服务。
- `SharedModule` 负责全局共享基础设施；领域模块只注册自身需要的实体、Controller 和 Provider。
- 商城仅预留，不创建商城业务代码。
- 未确认的预约取消、改期、容量口径、手机号、通知模板、媒体约束等规则不得自行固化。

## 文件与命名

- 目录和文件使用 kebab-case。
- Entity、DTO、Controller、Service、Module、Migration、Filter、Guard、Interceptor、Pipe 和纯工具函数使用对应后缀：`.entity.ts`、`.dto.ts`、`.controller.ts`、`.service.ts`、`.module.ts`、`.filter.ts`、`.guard.ts`、`.interceptor.ts`、`.pipe.ts`、`.util.ts`。
- 领域模块按职责组织为 `dto/`、`entities/`、`<feature>.controller.ts`、`<feature>.service.ts`、`<feature>.module.ts`；没有实际职责的文件不预先创建。
- `index.ts` 仅用于稳定的公共导出，避免为了缩短路径而暴露内部实现。
- 当前 `tsconfig.json` 未配置 `@/` 别名，新增代码不得假设该别名可用；遵循项目当前 ESM 导入写法。

## Controller 与 API

- Controller 只负责路由、DTO 接收、鉴权/授权边界和调用公开 Service，不承载复杂领域逻辑。
- 遵循现有 REST API 路由和 HTTP 方法约定；不要因参考项目习惯擅自引入 PATCH、PUT、DELETE 或新的路由风格。
- 业务接口必须携带 `Accept: application/vnd.scenic.v1+json`；健康检查和 Swagger 遵循现有豁免规则。
- Controller 方法添加简洁中文 JSDoc，描述当前真实行为，不写未实现能力。
- 变更接口时同步响应信封、OpenAPI 和测试。

## 验证

新增模块后至少检查模块依赖方向、导出边界、路径导入、TypeScript 类型检查、Lint、单元测试、E2E 测试和构建结果。
