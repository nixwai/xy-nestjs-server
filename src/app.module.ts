import { loadEnvironment } from './config/environment.js';

loadEnvironment();

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RbacGuard } from './modules/authorization/guards/rbac.guard.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/config.validation.js';
import configuration from './config/configuration.js';
import { RateLimitGuard } from './common/guards/index.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { SharedModule } from './shared/database/shared.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { PermissionModule } from './modules/permission/permission.module.js';
import { RoleModule } from './modules/role/role.module.js';
import { AuthorizationModule } from './modules/authorization/authorization.module.js';
import { SiteModule } from './modules/site/site.module.js';
import { AttractionModule } from './modules/attraction/attraction.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { GuideModule } from './modules/guide/guide.module.js';
import { GuideSessionModule } from './modules/guide-session/guide-session.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { TaskModule } from './modules/task/task.module.js';

/** 注册应用模块、领域模块和全局请求处理能力。 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      ignoreEnvFile: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    SharedModule,
    HealthModule,
    AuthModule,
    UserModule,
    AdminModule,
    PermissionModule,
    RoleModule,
    AuthorizationModule,
    SiteModule,
    AttractionModule,
    MediaModule,
    GuideModule,
    GuideSessionModule,
    BookingModule,
    NotificationModule,
    AuditModule,
    StorageModule,
    TaskModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
