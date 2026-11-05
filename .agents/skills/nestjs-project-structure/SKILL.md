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
  modules/{admin,attraction,audit,auth,authorization,booking,guide,guide-session,health,media,menu,notification,permission,role,site,storage,task,user}
  shared/{database,persistence.module.ts}
config/
scripts/
test/{unit,e2e}
```

- `src/modules` 是领域模块边界。
- `src/common` 保存跨模块的框架级横切能力。
- `src/config` 保存配置类型、常量、环境加载、配置构建和校验。
- `src/database/migrations` 保存 TypeORM Migration。
- `src/shared/database` 保存全局数据库基础设施；`src/shared/persistence.module.ts` 是仓储实现的唯一装配点，`SharedModule` 根据配置决定是否加载数据库模块。
- `config/config.yaml` 是仓库内唯一 YAML 配置模板。
- `scripts` 保存 OpenAPI 等开发工具脚本。
- `test/unit` 保存单元测试，`test/e2e` 保存端到端测试，`test/setup.ts` 保存测试初始化。

当前已实现 Controller、Service 和实际接口的领域模块是 `admin`、`audit`、`auth`、`health`、`menu`、`permission`、`role`；`authorization` 只提供 Guard 和授权查询，不暴露接口。其余模块是模块边界占位，不得将占位模块描述或扩展为已存在的业务能力。

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
- 领域常量使用 `<name>.constant.ts`，领域枚举使用 `<name>.enum.ts`，领域工具使用 `<name>.util.ts`，领域类型使用 `<name>.types.ts`。
- 模块内可复用的已导出业务类型放在 `<feature>/types/`，领域纯函数放在 `<feature>/utils/`。
- 跨模块复用的非业务类型放在 `src/common/types/`，非业务纯函数放在 `src/common/utils/`。
- 仓储 Port 文件只声明注入令牌和契约接口，输入输出记录类型归属模块 `types`。
- 只被单个文件使用且不导出的辅助类型和辅助函数留在该文件内，不为它们新建文件。
- 完整业务模块按以下形式组织：

```text
<feature>/
  constants/
  dto/
  entities/
  repositories/
  types/
  utils/
  <feature>.controller.ts
  <feature>.module.ts
  <feature>.service.ts
```

目录只有在实际存在对应代码时创建，不为未确认业务预留空文件。

## 测试文件组织

- 测试目录结构应镜像源码模块和职责边界。
- 一个测试文件聚焦一个生产模块或一个紧密相关的适配器，不跨多个领域聚合无关 Controller 测试。
- 测试替身、集成适配器和领域服务分别命名，名称应能表达被验证的行为边界。
- 只有真实驱动或数据库才能暴露的行为（列类型水合、DDL 归一、保留字列名、唯一约束）必须补不依赖数据库连接的守卫测试，例如基于 TypeORM 元数据和 `new DataSource(...).driver` 的纯内存断言；不得因为内存实现测试全绿就认定持久化行为已验证。

## 导入与路径

当前源码使用 NodeNext ESM 和显式 `.js` 导入后缀。新增代码必须保持该运行时解析方式。

项目规范保留 `@/*` 作为未来跨模块导入别名；只有在 TypeScript、测试运行器和构建工具完成一致配置后才能使用，不得在当前未配置别名的环境中直接引入不可解析的路径。

## 模块注册

- 新模块必须在 `src/app.module.ts` 中注册。
- 全局 Provider 使用 `APP_GUARD`、`APP_INTERCEPTOR` 或 `APP_FILTER` 注册；当前全局能力包括进程内限流守卫、成功响应拦截器和异常过滤器。
- 需要数据库的模块使用 TypeORM 模块集成方式，并遵守数据库开关和 Migration 约束。

## 持久化装配与种子数据边界

### 仓储装配

- Repository Port 令牌只在 `src/shared/persistence.module.ts` 装配一次，由该文件按数据库开关选择 TypeORM 实现或内存实现，并统一声明 `TypeOrmModule.forFeature` 和 `databaseEntities`。
- 领域模块只声明 Controller、Service 和领域 Provider，通过 Port 令牌注入仓储。
- 禁止在领域模块内重复 `provide` 已由全局持久化模块导出的令牌，禁止重复注册 `TypeOrmModule.forFeature`，也禁止在领域模块内读取 `shouldLoadDatabaseModule()` 做装配分支。同一令牌存在两个 Provider 时，后注册者覆盖全局实现，数据库开关和测试 `overrideProvider` 行为都会失真。
- 新增仓储按顺序改三处：领域模块 `repositories/<name>-repository.port.ts` 定义令牌和契约，TypeORM 实现与内存实现分别落在同目录，最后在 `src/shared/persistence.module.ts` 注册 Provider、导出令牌并把 Entity 加入 `databaseEntities`。
- 领域模块的 `@Module` 声明应与 `PermissionModule`、`MenuModule` 保持同一形态：`imports` 只列协作模块，`providers` 只列本模块的 Service。
- 同一 Port 的内存实现与 TypeORM 实现必须返回运行时同构的记录：领域记录声明 `boolean` 时，TypeORM 实现不得把驱动水合出的 `0/1` 数字直接透传。单元测试和 E2E 恒在 `DB_ENABLED=false` 下使用内存实现，驱动侧类型分歧只有真实数据库才会暴露，因此列声明与领域记录类型的一致性必须由不依赖数据库连接的元数据级守卫测试保证，参考 `test/unit/shared/database/entity-boolean-column.spec.ts`。

### 注册表种子数据

- 权限和菜单的基础数据由代码注册表在启动同步时创建和对齐，Migration 不重复声明这些字面量。
- Migration 只负责表结构、索引和不可由代码推导的数据变更（历史数据回填、废弃数据清理）。可由注册表推导的种子数据写入 Migration 会形成第二份事实来源，并在应用先于 `migration:run` 启动时与启动同步争抢唯一键。
- 新增权限或菜单只修改注册表，不新增数据 Migration；下线权限或菜单时从注册表移除定义，并通过显式 Migration 清理数据库记录。
- 注册表驱动的字段必须区分作者：只有代码作者的字段（权限的名称、描述、分类、分配边界；菜单的路径、父级、权限编码、根管理员边界）由启动同步创建和对齐，数据库作者的字段（权限 `isActive`；菜单标题、排序、`isActive`）启动同步不得写入。
- 注册表自身矛盾属于代码缺陷，启动校验必须抛错阻止启动；数据库落后于注册表属于正常发布过程，直接对齐而不是阻止启动。数据库同时保存人工编辑字段且代码无法判断预期结果时（如菜单结构漂移），改为抛错阻止启动并要求通过 Migration 发布。
- 注册表之外的孤儿数据按运行时影响分级处理：不影响运行时结构的只输出 warn 日志列出标识并提示通过 Migration 清理，不阻止启动（如历史权限编码，没有任何路由再声明它，持有者拿不到能力）；会被运行时消费的必须抛错阻止启动（如未知 `menuKey` 仍会渲染进管理端导航树）。告警和同步结果都通过 `Logger` 输出，只在实际发生写入或发现孤儿数据时打印。
- 启动同步在 `onModuleInit` 中执行，写入数据库时输出一行汇总日志；被其他模块启动校验依赖的注册表同步必须在依赖方之前完成，模块 `imports` 顺序即初始化顺序。
- 启动同步和启动校验对注册表与数据库记录做严格相等比较，比较前必须确认两侧运行时类型一致：类型分歧会被严格比较放大为每次启动重复写入（注册表对齐）或直接阻止启动（结构校验）。新增或修改代码维护字段时，必须同时检查列声明、领域记录类型和注册表定义三者一致。

## API 形态

业务 API 统一采用：

- 查询使用 `GET`，参数通过 `@Query()` 接收。
- 写操作使用 `POST`，参数通过 `@Body()` 接收。
- 不使用 `PATCH`、`PUT`、`DELETE` 作为业务写操作方法。
- 资源路由使用小写单数名词。
- 创建、更新、删除和批量删除采用明确动作路径，例如 `/resource/create`、`/resource/update`、`/resource/soft-delete`、`/resource/batch-soft-delete`。
- 更新请求包含资源定位字段；删除请求使用专用 DTO。
- 所有业务接口遵守统一 API 响应规则。

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
