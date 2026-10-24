---
name: scenic-error-handling
description: 在景区导游预约平台中实现或审查 API 响应、异常过滤、业务错误码和请求校验时使用；不替代具体领域业务错误定义。
---

# 景区预约平台异常处理与响应规范

## 统一响应

所有业务 API 使用统一信封：

```typescript
{
  code: number;
  message: string;
  data: T | null;
}
```

- 成功响应由 `TransformInterceptor` 统一包装为 `{ code: 0, message: 'success', data }`。
- Controller 不重复手写成功信封，返回业务数据或 `null` 即可。
- 错误响应由 `GlobalExceptionFilter` 统一生成，`data` 必须为 `null`。
- 业务错误码使用 `src/common/enums/http-code.enum.ts` 中的定义；新增错误码必须有明确业务依据并保持编号规则一致。

## 异常边界

- 客户端可处理的业务错误返回统一业务 code 和安全消息；当前项目约定其 HTTP 状态由全局过滤器统一处理。
- 未知异常、基础设施异常和服务端错误不得将堆栈、SQL、文件路径、令牌或内部配置返回给客户端。
- 服务端错误必须记录足够的服务端上下文，同时向客户端返回稳定、非敏感的错误消息。
- 不得静默吞掉异常；能够恢复时显式处理，不能恢复时向统一过滤器抛出。
- 领域模块抛出异常时只依赖公开的业务错误契约，不暴露 Repository、数据库驱动或第三方 SDK 细节。

## 输入校验

全局请求校验使用 `createStrictValidationPipe()`，必须保持：

- `whitelist: true`：剥离未声明属性。
- `forbidNonWhitelisted: true`：请求包含未知属性时拒绝。
- `transform: true`：将请求转换为 DTO 实例并执行类型转换。

新增接口必须使用 DTO 接收边界输入，不得直接信任 `@Body()`、`@Query()` 或外部服务数据。

## 接口同步

新增或修改接口时同步检查：

- API 版本头 `Accept: application/vnd.scenic.v1+json`；健康检查和 Swagger 按现有豁免规则处理。
- 成功和错误响应是否符合统一信封。
- 错误码、消息和 HTTP 行为是否有测试覆盖。
- Swagger/OpenAPI 是否与实际响应和输入契约一致。
