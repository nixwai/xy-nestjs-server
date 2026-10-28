---
name: nestjs-security
description: 实施本项目 NestJS 的配置安全、请求边界、HTTP 安全、限流和未来认证安全约束。适用于认证、权限、输入处理、敏感配置、API 防护或错误信息处理任务。
---

# 安全规范

## 密钥与敏感配置

- 源码、YAML、环境模板、测试配置和日志中禁止提交生产密钥、数据库密码、COS SecretId、COS SecretKey、微信 AppSecret、JWT 密钥或 Token。
- 敏感值通过运行时环境变量注入；业务代码不直接读取 `process.env`，统一使用配置入口和 `ConfigService`。
- 禁止使用 `default-secret`、`password`、`change-me`、`test-only` 等弱默认值作为生产凭据。
- 配置开关启用外部能力时，必须由 Joi 校验确保凭据完整。
- `JWT_SECRET` 必须满足配置校验要求；生产环境拒绝占位符和测试密钥。

## HTTP 安全

应用启动配置必须保持：

- 使用 `helmet()` 设置安全响应头；
- 使用配置中的 CORS 来源列表，来源为空时不开放任意来源；
- 使用全局严格 `ValidationPipe`；
- 使用 API 版本守卫校验业务请求的 `Accept` 头；
- 使用 `RateLimitGuard` 按客户端 IP 在进程内限流。

不要把 CORS 改为任意来源并同时允许凭据，不要删除版本校验或限流而不提供等价的安全设计。

## 输入与输出边界

- 所有外部输入必须进入 DTO 和 `class-validator` 校验边界。
- 保持 `whitelist: true`、`forbidNonWhitelisted: true` 和 `transform: true`。
- 数据库查询使用参数绑定，禁止拼接用户输入构造 SQL、QueryBuilder 条件或排序字段。
- 响应中不得返回密码、密钥、Token、内部数据库凭据、堆栈、SQL、绝对路径或其他内部诊断信息。
- 错误由 `GlobalExceptionFilter` 统一转换；日志不得泄露敏感值。

## JWT 与认证边界

当前仓库尚未实现 JWT Strategy、认证 Guard、用户登录接口或 RBAC。新增认证能力时必须：

- 从 `ConfigService` 读取 JWT 密钥，禁止硬编码；
- 强制校验令牌过期时间，不忽略过期；
- 仅从 `Authorization: Bearer <token>` 提取访问令牌；
- 区分未认证和无权限错误；
- 在模块边界内实现认证与授权；
- 加入权限规则前确认真实角色、资源和操作范围。

## 限流

- 限流参数来自 `throttler.ttl` 和 `throttler.limit`。
- 当前实现是进程内、按请求 IP 计数的窗口限流，不是分布式或持久化限流。
- 超限使用 HTTP 429，由全局异常过滤器转换为业务错误码 `42900`。
- 修改限流实现时覆盖窗口过期、计数清理、未知 IP 和超过上限等场景。
