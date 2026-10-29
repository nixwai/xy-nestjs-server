---
name: nestjs-entity-dto
description: 设计和实现本项目未来的 TypeORM Entity、请求 DTO、响应 DTO、分页查询和关系数据结构。仅适用于数据库模型、请求校验或 API 数据契约设计，不描述当前仓库已有的业务实体。
---

# Entity 与 DTO 规范

当前仓库尚未实现业务 Entity、DTO 或业务 CRUD 接口。新增这些代码时，必须以已确认的业务需求为依据，不得从模块名称推导实体、字段、接口或业务规则。

## Entity

- Entity 文件使用 `<resource>.entity.ts`，类名使用 PascalCase。
- 表名使用 snake_case 单数形式；属性使用 camelCase，由 `SnakeNamingStrategy` 映射数据库字段。
- 主键统一使用 `@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })`。
- 创建和更新时间使用 `@CreateDateColumn({ type: 'datetime' })` 与 `@UpdateDateColumn({ type: 'datetime' })`。
- TypeORM 填充的属性使用 `!`；列定义显式声明与业务和数据库约束有关的选项。
- 对实际查询、排序、唯一性或关联约束建立命名索引或唯一约束。
- 多对多关系使用独立关系 Entity，不使用 `@ManyToMany` 与 `@JoinTable` 隐式生成中间表。
- 大文本或低频字段仅在查询模式确认后拆分为独立 Entity。

## 删除与查询

- 业务实体使用可空的 `deletedAt` 时间字段记录删除时间；需要 TypeORM 自动过滤时使用 `@DeleteDateColumn`。
- 查询默认排除 `deletedAt` 非空记录；删除使用 TypeORM 软删除能力或更新 `deletedAt`，禁止对业务实体执行物理删除。
- 单条查找封装为私有查找方法；资源不存在时抛出 `NotFoundException`。
- 创建和更新前执行必要的唯一性检查，冲突时抛出 `ConflictException`。
- 动态列表查询使用 `createQueryBuilder` 和参数绑定，禁止拼接用户输入。
- 列表结果统一返回 `{ items, total }`，分页参数必须经过 DTO 校验。
- 关系数据更新使用事务或明确的先删后插策略，避免暴露中间状态。

## 请求 DTO

- 请求 DTO 使用 kebab-case 文件名；必填属性使用 `!`，可选属性使用 `?`。
- 每个外部输入字段使用 `class-validator` 进行类型和范围校验。
- 可选字段同时使用 `@IsOptional()` 和对应类型校验。
- 数字、日期、数组和嵌套对象显式声明转换和校验规则。
- Create DTO 与 Update DTO 独立定义；Update DTO 字段默认全部可选，并包含资源定位用的 `id`。
- 批量操作使用独立 DTO，数组元素逐项校验。
- 查询 DTO 可复用公共分页 DTO；当前 `src/common/dto/` 尚无分页实现，新增前必须确认分页口径。
- 请求 DTO 不使用 Swagger 响应装饰器代替输入校验。

```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
```

## 响应 DTO 与 Swagger

- 响应 DTO 用于公开 API 数据契约和 Swagger 文档时，使用 `@ApiProperty` 或 `@ApiPropertyOptional`。
- 可空字段同时在 TypeScript 类型和 Swagger 装饰器中体现，并显式声明基础类型；日期、数组、嵌套 DTO 和枚举显式声明类型。
- 请求 DTO 的校验规则与响应 DTO 的 Swagger 文档分别承担输入校验和输出描述职责。
- Service 返回数据时映射为响应 DTO 或明确的公开对象，不暴露密码、密钥、内部凭据和非 API 字段。

## 媒体 URL

公开媒体字段返回前，根据实际存储约定转换为完整访问地址，并复用已确认的存储抽象；不得直接引用未实现的工具函数或虚构代理地址。

## 领域归属与契约边界

- 每个 Entity 必须有唯一的领域归属和明确的维护模块。
- DTO 不得直接复用 Entity；请求 DTO、响应 DTO、持久化 Entity 和内部领域记录应职责分离。
- 多对多关系优先使用显式关系 Entity，以便承载约束、状态、审计和扩展字段。
- 关系变更应由一个应用服务统一维护，并在明确的事务边界内完成。
- 跨模块只传输稳定 ID、值对象或公开契约，不传播内部 Entity 实例和 Repository。
- 响应 DTO 必须排除密码、密钥、Token、内部凭据和持久化实现细节。
- 索引、唯一约束和外键必须服务于真实的不变量、查询条件或关联约束。
- 关联查询、状态变化和批量关系更新必须明确一致性要求，避免暴露中间状态。
- DTO 校验只负责外部输入边界；领域不变量仍必须在应用服务或领域服务中再次保证。
- 数据模型、DTO 和关系契约的设计应优先降低变更扩散，而不是单纯减少文件或模块数量。
