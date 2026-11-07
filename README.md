# 服务端

## 技术栈

- Node.js 24+
- pnpm 11+
- NestJS 12
- TypeScript 6
- TypeORM
- MySQL 8
- Vitest + Supertest
- Docker / Docker Compose
- Swagger / OpenAPI 3

## 环境要求

- Node.js 24 或更高版本
- pnpm 11 或更高版本
- Docker 和 Docker Compose
- MySQL 8 或可用的 MySQL 服务

## 安装依赖

```bash
pnpm install --frozen-lockfile
```

## 配置环境

复制环境变量模板：

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.development.local
```

```bash
cp .env.example .env
cp .env.example .env.development.local
```

根据本地环境修改 `.env` 或 `.env.development.local`，至少配置：

- `DB_PASSWORD`
- `JWT_SECRET`：不少于 32 个字符
- `AUTH_RSA_PRIVATE_KEY`：Base64 编码的 PKCS#8 RSA-2048 私钥 DER
- `CORS_ORIGINS`

不要将真实密码、密钥和连接信息提交到仓库。

## 启动数据库

```bash
docker compose up -d mysql
docker compose ps
docker compose stop mysql
```

## 数据库操作

```bash
pnpm migration:show
pnpm migration:run
pnpm migration:revert
```

## 初始化账户

```bash
pnpm admin:init
```

## 启动服务

```bash
pnpm start
pnpm start:dev
pnpm start:debug
```

默认地址为 `http://localhost:3000`，API 前缀为 `/api`。

Swagger 文档默认地址为 `http://localhost:3000/docs`。

## 生产启动

```bash
pnpm build
pnpm start:prod
```

## 检查与测试

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm test:cov
```

## OpenAPI

```bash
pnpm openapi:generate
```
