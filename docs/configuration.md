# 配置说明

## 配置来源

项目只保留一个 YAML 配置模板：

```text
config/config.yaml
```

YAML 负责配置分组、稳定默认值和不可变基础策略。环境差异由环境文件或运行时环境变量控制，敏感信息不得写入 YAML。

## 环境文件

```text
development:
  .env.development.local → .env.development → .env

test:
  .env.test.local → .env.test

production:
  只读取 CloudBase 注入的运行时环境变量
```

箭头左侧优先级更高。运行时已经存在的环境变量始终优先于所有文件。

`.env.example` 和安全的 `.env.test` 可以提交。`.env`、`.env.development`、所有 `*.local` 文件以及生产环境文件禁止提交。

## 配置处理流程

```text
加载环境文件
→ 读取 config/config.yaml
→ 显式映射环境变量
→ 类型转换
→ Joi 校验
→ ConfigService 注入
```

应用启动、Vitest、TypeORM CLI 和 OpenAPI 生成使用同一个环境加载入口。业务模块不得直接读取 `process.env`。

## 校验规则

- JWT 密钥至少 32 位。
- 开发和生产环境必须显式启用数据库。
- 测试环境强制关闭数据库，外部 `DB_ENABLED=true` 也不会建立真实连接。
- 数据库启用时必须提供完整连接参数，且 `synchronize` 永远为 `false`。
- 生产环境必须显式提供数据库连接参数，不依赖 YAML 默认值。
- COS 和微信仅在对应开关开启时校验完整凭据。
- 生产环境拒绝占位 JWT 密钥和测试 JWT 密钥。

## 生产环境

生产环境不读取 `.env.production`。CloudBase 云托管必须通过运行时环境变量提供：

```text
DB_*
JWT_SECRET
COS_*
WECHAT_*
```

部署前必须完成配置校验，缺少必填变量时服务直接启动失败。
