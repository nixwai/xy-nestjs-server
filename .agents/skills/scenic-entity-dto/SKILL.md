---
name: scenic-entity-dto
description: 在景区导游预约平台中设计或修改 TypeORM Entity、请求 DTO、查询分页 DTO、响应类型和数据库约束时使用；不用于凭空设计未经确认的领域模型。
---

# 景区预约平台 Entity 与 DTO 规范

## Entity

- Entity 放在对应领域模块的 `entities/` 目录，文件使用 `<name>.entity.ts`。
- 表名使用 snake_case 单数名词，例如 `@Entity('guide_session')`，不得使用复数表名。
- TypeORM 字段必须显式声明与数据库相关的选项；不要依赖隐式类型、长度或可空性。
- 主键默认使用 `@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })`，除非已有数据库约定明确要求其他类型。
- 创建时间和更新时间分别使用 `@CreateDateColumn({ type: 'datetime' })`、`@UpdateDateColumn({ type: 'datetime' })`。
- TypeORM 运行时填充的属性使用 definite assignment `!`；真正可空的数据库字段必须在 TypeScript 类型和装饰器中明确表达。
- 根据真实查询条件添加命名索引；复合业务唯一性使用命名 `@Unique` 约束。
- 大文本、低频字段或媒体元数据在有明确访问模式时拆分实体，不为了抽象而拆分。
- 多对多关系优先使用独立中间 Entity，以便表达唯一约束、审计字段和后续业务属性；不得为未经确认的关系擅自建模。
- 所有结构变更必须通过 `src/database/migrations/` Migration，禁止依赖 `synchronize`。
- 数据库命名遵循项目配置的 `SnakeNamingStrategy`，Entity 属性使用清晰的 camelCase。

## DTO

- DTO 放在对应领域模块的 `dto/` 目录；通用 DTO 放在 `src/common/dto/`。
- DTO 只负责边界输入校验和类型转换，不承载领域服务逻辑。
- 必填属性使用 `!`，可选属性使用 `?`；可选字段必须同时使用 `@IsOptional()` 和对应类型校验。
- 所有外部输入必须有 `class-validator` 校验；数值、布尔值和日期等需要显式使用 `class-transformer` 转换。
- Create DTO 与 Update DTO 独立定义，不通过继承隐藏字段语义。
- Update DTO 的字段按实际更新契约设为可选，并包含明确的资源标识字段；不要把数据库 Entity 直接作为请求 DTO。
- 批量操作使用独立 DTO，数组元素必须逐项校验；查询 DTO 继承项目已有分页 DTO 后再增加筛选字段。
- 分页参数必须限制最小值、最大值和默认值，避免无界查询。
- 不在 DTO 中添加与当前接口无关的字段。
- Swagger 装饰器是否添加以当前接口文档方案为准，不得为了套用参考项目而引入不兼容的装饰器规则。

## 服务层配合

- Service 通过 Repository 访问 Entity，不让 Controller 直接操作数据库。
- 唯一性检查、关联同步、软删除和分页查询必须基于已确认的业务规则实现。
- 写操作返回值、列表分页结构和响应 DTO 必须与当前 API 契约一致；没有业务依据时不要新增伪响应字段。
