# 架构说明

## 系统边界

微信小程序和 PC 管理后台只通过 NestJS REST API 访问业务能力。NestJS 负责用户、管理员、景区、场次、预约、通知、审计和未来商城的数据事实源。

## 模块化单体

领域模块位于 `src/modules`，通过模块边界隔离。`common` 存放横切能力，`shared/database` 提供 TypeORM 基础设施。当前领域模块只有边界文件，不包含伪业务实现。

## 数据与外部服务

生产使用 CloudBase MySQL 和腾讯云 COS。业务模块不得直接依赖 COS SDK。数据库结构统一通过 TypeORM Migration 管理，生产禁止 synchronize。
