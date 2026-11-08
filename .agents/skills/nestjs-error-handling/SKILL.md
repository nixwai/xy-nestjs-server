---
name: nestjs-error-handling
description: 维护本项目 NestJS 的统一成功响应、异常过滤、业务错误码和请求参数校验行为。适用于修改全局过滤器、拦截器、ValidationPipe 或 API 响应契约的任务。
---

# 异常处理与响应规范

## 统一成功响应

全局 `TransformInterceptor` 将控制器返回值包装为：

```typescript
{ code: 0, message: 'success', data: T | null }
```

控制器只返回业务数据，不重复包装成功响应，也不绕过全局拦截器创建第二套成功结构。

## 统一错误响应

全局 `GlobalExceptionFilter` 将异常转换为：

```typescript
{ code: number, message: string, data: null }
```

- `HttpException` 的客户端消息和显式业务码可以从异常响应体提取。
- 未提供业务码时，根据 HTTP 状态映射到 `HttpCode`。
- 4xx 异常返回 HTTP 200，并在响应体中提供业务错误码。
- 5xx 异常返回 HTTP 500，隐藏堆栈、SQL、路径和其他内部细节。
- 未知异常按 500 处理，并由服务端日志记录上下文。
- 不静默吞掉异常；应显式处理后抛出，或交由全局过滤器处理。

## 业务错误码

`src/common/enums/http-code.enum.ts` 是业务错误码唯一来源：

| 名称 | 数值 | 用途 |
|---|---:|---|
| `SUCCESS` | `0` | 成功 |
| `BAD_REQUEST` | `40001` | 请求参数无效 |
| `UNAUTHORIZED` | `40100` | 未通过身份认证 |
| `FORBIDDEN` | `40300` | 无权执行请求 |
| `NOT_FOUND` | `40400` | 资源不存在 |
| `CONFLICT` | `40900` | 资源状态冲突 |
| `UNPROCESSABLE_ENTITY` | `42200` | 业务校验失败 |
| `TOO_MANY_REQUESTS` | `42900` | 超过访问频率限制 |
| `INTERNAL_SERVER_ERROR` | `50000` | 未预期服务端错误 |

新增错误码前先确认是否能复用现有状态码；业务码不得与 HTTP 状态码或成功码混用。

## 请求校验

全局管道由 `createStrictValidationPipe()` 创建，必须保持：

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

- `whitelist: true`：只保留 DTO 声明字段。
- `forbidNonWhitelisted: true`：包含未声明字段时拒绝请求。
- `transform: true`：按 DTO 类型执行转换。
- 外部输入必须通过 DTO 和 `class-validator` 校验。
