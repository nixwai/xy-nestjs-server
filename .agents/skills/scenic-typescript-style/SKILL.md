---
name: scenic-typescript-style
description: 在景区导游预约平台中编写、重构或审查 TypeScript/NestJS 代码时使用，统一不可变性、JSDoc、类型定义、ESM 导入、桶文件、工具函数、错误处理和代码复杂度。
---

# 景区预约平台 TypeScript 编码风格规范

## 不可变性原则

优先创建新对象、数组和返回值，避免修改调用方持有的对象或共享状态：

```typescript
// 避免：直接修改已有对象
Object.assign(user, data);

// 推荐：创建新对象
return { ...user, ...data };
```

- 不直接修改方法参数、配置对象或跨层共享对象，除非当前 API 明确要求原地修改。
- 更新数组时优先使用 `map`、`filter`、展开语法等返回新数组的方式。
- 不为了追求不可变性而引入复杂库；保持实现可读、可测试。

## JSDoc 注释规范

所有类、方法、属性、DTO、Entity、配置接口和枚举必须有与当前行为一致的中文 JSDoc 注释。

### 类和方法

```typescript
/** 用户服务，封装用户数据访问操作。 */
@Injectable()
export class UserService {
  /**
   * 创建新用户。
   * @param username - 用户名。
   * @param email - 邮箱地址。
   * @param hashedPassword - 已加密的密码。
   * @returns 创建后的用户。
   */
  async create(
    username: string,
    email: string,
    hashedPassword: string,
  ): Promise<User> {
    // ...
  }
}
```

- 公开方法必须说明用途；存在参数或返回值时使用 `@param` 和 `@returns`。
- 私有方法在用途、边界或算法不明显时补充注释。
- Controller 方法必须说明当前真实接口行为，不写尚未实现的能力。

### DTO 和 Entity 属性

```typescript
/** 注册请求参数。 */
export class RegisterDto {
  /** 用户名，长度限制由请求校验装饰器定义。 */
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;
}

/** 用户实体，映射 user 表。 */
@Entity('user')
export class User {
  /** 用户主键 ID。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;
}
```

### 接口和类型

接口或类型要有整体用途说明，每个属性要有字段含义说明：

```typescript
/** 数据库配置。 */
export interface DatabaseConfig {
  /** 数据库主机地址。 */
  host: string;

  /** 数据库端口。 */
  port: number;
}
```

汇总接口通过注释说明各分组用途：

```typescript
/** 应用总配置。 */
export interface ApplicationConfig {
  /** 数据库配置。 */
  database: DatabaseConfig;
}
```

- 注释只解释当前代码做什么，不保留迭代历史、临时方案、个人署名或与实现不一致的承诺。
- 注释内容必须随着代码行为、字段含义和公开接口变化同步更新。

## 类型与命名

- 保持项目 `tsconfig.json` 的 `strict: true`，为公开函数、Service 方法、配置对象和响应结构声明明确类型。
- 必填字段和 TypeORM 运行时填充的属性按项目 Entity/DTO Skill 约定使用 `!`；真正可选或可空的值必须在类型中明确表达。
- 避免无意义的 `any`、过宽的类型断言和隐式可空值；外部数据必须先校验再使用。
- 类型、接口、枚举和类使用 PascalCase；变量、方法和属性使用 camelCase；文件和目录使用 kebab-case。
- 命名使用当前景区预约领域的准确术语，不复制 blogger-server 的 article、tag、slug 等博客领域命名。

## 模块导入和路径别名

- 项目使用 NodeNext ESM；本地 TypeScript 导入必须带实际运行时需要的 `.js` 后缀。
- 当前 `tsconfig.json` 未配置 `@/` 路径别名，不得假设该别名可用，也不要为了套用参考项目修改路径解析配置。
- 相对路径层级较深时，应先评估模块边界、公共导出或目录结构是否合理；不得用未配置的别名掩盖结构问题。

```typescript
// 当前项目正确写法
import { JwtConfig } from '../../config/config.types.js';
import { HttpCode } from '../enums/index.js';
```

## 桶文件导出规范

- `index.ts` 仅用于稳定的公共导出，不用于隐藏循环依赖或暴露内部实现。
- 桶文件优先使用 `export *`，并保留当前项目的 `.js` 导入后缀：

```typescript
export * from './http-code.enum.js';
```

- 只有在需要选择性导出、重命名或避免公开内部符号时，才使用 named export。
- 新增导出后检查循环依赖、调用方和构建产物。

## 工具函数提取

- 无副作用的纯函数提取到 `src/common/utils/<功能>.util.ts`，使用命名导出。
- 新增工具函数前先检查 `src/common/utils/` 是否已有可复用实现；当前项目已有 `config.util.ts`，不得重复实现相同配置处理逻辑。
- 工具函数应保持单一职责，输入和返回值类型明确，并覆盖边界条件。
- 只有在当前项目存在真实需求时才新增工具函数，不迁移博客项目专属的 slug、文章或标签工具。

```typescript
/** 将配置来源合并为应用可消费的配置记录。 */
export function mergeConfigValues(
  base: Readonly<Record<string, unknown>>,
  override: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return { ...base, ...override };
}
```

## 错误处理

- 不静默吞掉错误；必须显式处理、记录必要上下文或向统一异常边界抛出。
- 异步调用必须处理失败路径，避免未处理 Promise，并遵循 Oxlint 的 `typescript/no-floating-promises` 规则。
- 客户端错误不得返回异常对象、堆栈、SQL、文件路径、令牌、密钥或配置内容。
- 服务端记录详细但脱敏的上下文，由统一异常过滤器生成对外响应。

## 代码质量约束

| 项目 | 限制 |
|------|------|
| 函数行数 | 通常小于 50 行 |
| 文件行数 | 通常小于 800 行 |
| 嵌套层级 | 通常不超过 4 层 |
|

超出限制时先检查职责边界、重复逻辑和隐藏的副作用，再决定是否拆分；不要为了满足数字机械拆分代码。

## 工具链

- 修改 TypeScript 后遵循项目 `.prettierrc` 和 `.oxlintrc.json`，不引入新的格式化或 Lint 体系。
- 修改注释、类型、导出或工具函数后，同步检查调用方、测试和 OpenAPI 生成结果。
- 完成修改后按变更范围执行 `pnpm typecheck`、`pnpm lint`、相关测试和 `pnpm build`。
