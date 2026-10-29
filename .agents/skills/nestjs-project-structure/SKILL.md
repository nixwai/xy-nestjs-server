---
name: nestjs-project-structure
description: 维护本项目 NestJS 模块边界、目录组织、命名、模块协作和业务 API 形态。适用于新增模块、Controller、Service、Entity、DTO、公共能力或迁移文件的任务。
---

# NestJS 项目结构规范

## 当前结构

```text
src/
  common/{constants,decorators,dto,enums,filters,guards,interceptors,pipes,types,utils}
  config/
  database/migrations/
  modules/{admin,attraction,audit,auth,booking,guide,guide-session,health,media,notification,site,storage,task,user}
  shared/database/
config/
scripts/
test/{unit,e2e}
```

- `src/modules` 是领域模块边界。
- `src/common` 保存跨模块的框架级横切能力。
- `src/config` 保存配置类型、常量、环境加载、配置构建和校验。
- `src/database/migrations` 保存 TypeORM Migration。
- `src/shared/database` 保存全局数据库基础设施；`SharedModule` 根据配置决定是否加载数据库模块。
- `config/config.yaml` 是仓库内唯一 YAML 配置模板。
- `scripts` 保存 OpenAPI 等开发工具脚本。
- `test/unit` 保存单元测试，`test/e2e` 保存端到端测试，`test/setup.ts` 保存测试初始化。

当前领域模块中只有 `health` 包含 Controller、Service 和实际接口；其他模块是模块边界占位。不得将占位模块描述或扩展为已存在的业务能力。

## 模块职责

- 一个领域模块负责自身的 Controller、Service、DTO、Entity 和业务协作。
- 跨模块协作通过公开 Service 或明确接口完成，不直接访问其他模块的私有实现、Repository 或内部文件。
- 横切能力放入 `common`，全局基础设施放入 `shared`。
- 业务模块不得直接依赖腾讯云 COS SDK；对象存储通过 `storage` 模块抽象。
- 未确认领域只保留已存在的模块边界，不创建伪实体、伪 DTO、伪 API 或伪实现。

## 领域与基础设施边界

- `common` 只保存不依赖具体领域的横切能力；领域枚举、领域常量、领域工具和领域契约归属于对应模块。
- 完整模块可按 `presentation`、`application`、`domain`、`infrastructure` 分离职责；小型模块可保留扁平结构，但不得混淆层职责。
- Repository Port、应用服务、持久化实现和测试替身应保持清晰边界；生产适配器不得与测试替身混合为同一职责文件。
- 关联实体、关联仓储和关联事务应归属于维护其核心不变量的模块，避免由无关模块重复维护。
- 聚合根的删除、恢复和状态变更使用能够表达真实语义的方法名；软删除使用 `softDelete`，物理删除使用 `hardDelete`，避免使用含义不明确的 `remove`。

## 文件与命名

- 文件名统一使用 kebab-case。
- 使用约定后缀：`.module.ts`、`.controller.ts`、`.service.ts`、`.entity.ts`、`.dto.ts`、`.enum.ts`、`.util.ts`、`.filter.ts`、`.guard.ts`、`.interceptor.ts`。
- `index.ts` 仅用于稳定的公共导出；新增导出必须避免循环依赖。
- 领域常量使用 `<name>.constant.ts`，领域枚举使用 `<name>.enum.ts`，领域工具使用 `<name>.util.ts`。
- 未来完整业务模块可按以下形式组织：

```text
<feature>/
  dto/
  entities/
  <feature>.controller.ts
  <feature>.module.ts
  <feature>.service.ts
```

目录只有在实际存在对应代码时创建，不为未确认业务预留空文件。

## 测试文件组织

- 测试目录结构应镜像源码模块和职责边界。
- 一个测试文件聚焦一个生产模块或一个紧密相关的适配器，不跨多个领域聚合无关 Controller 测试。
- 测试替身、集成适配器和领域服务分别命名，名称应能表达被验证的行为边界。

## 导入与路径

当前源码使用 NodeNext ESM 和显式 `.js` 导入后缀。新增代码必须保持该运行时解析方式。

项目规范保留 `@/*` 作为未来跨模块导入别名；只有在 TypeScript、测试运行器和构建工具完成一致配置后才能使用，不得在当前未配置别名的环境中直接引入不可解析的路径。

## 模块注册

- 新模块必须在 `src/app.module.ts` 中注册。
- 全局 Provider 使用 `APP_GUARD`、`APP_INTERCEPTOR` 或 `APP_FILTER` 注册；当前全局能力包括 API 版本守卫、进程内限流守卫、成功响应拦截器和异常过滤器。
- 需要数据库的模块使用 TypeORM 模块集成方式，并遵守数据库开关和 Migration 约束。

## API 形态

业务 API 统一采用：

- 查询使用 `GET`，参数通过 `@Query()` 接收。
- 写操作使用 `POST`，参数通过 `@Body()` 接收。
- 不使用 `PATCH`、`PUT`、`DELETE` 作为业务写操作方法。
- 资源路由使用小写单数名词。
- 创建、更新、删除和批量删除采用明确动作路径，例如 `/resource/create`、`/resource/update`、`/resource/soft-delete`、`/resource/batch-soft-delete`。
- 更新请求包含资源定位字段；删除请求使用专用 DTO。
- 所有业务接口遵守统一 API 响应和 `Accept` 版本头规则。

当前健康检查接口是基础设施例外，使用 `/health` 和 `/health/ready`，并通过 `@SkipApiVersion()` 豁免业务版本头校验。

## 模块化与依赖边界

- 以领域边界、变化原因和核心不变量划分模块，不按文件数量机械拆分，也不把多个独立领域压入同一模块。
- 模块应保持高内聚；跨模块协作只能通过公开 Service、Port、接口或稳定值对象完成。
- 禁止跨模块直接访问 Entity、Repository、私有 Store 或内部文件。
- 关系实体归属于维护该关系核心不变量的模块。
- Controller 负责协议适配，Service 负责应用行为，Store 负责持久化访问，Entity 负责持久化映射。
- 全局 Guard、装饰器和授权上下文等横切能力应通过独立的公开契约提供。
- 模块依赖应保持单向；新增模块后必须检查循环依赖、初始化顺序和运行时依赖。
- 模块数量不是复杂度指标；耦合、变更扩散、依赖复杂度、认知负担和运行时链路复杂度才是主要复杂度指标。
- 模块拆分必须减少无关变更传播，并保持对外契约稳定。
