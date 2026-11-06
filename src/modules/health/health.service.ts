import { Inject, Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
/** 提供进程和依赖就绪状态。 */
@Injectable()
export class HealthService {
  /** 创建当前实例。 */
  constructor(
    /** 读取应用环境和数据库启用状态。 */
    @Inject(ConfigService) private readonly configService: ConfigService,
    /** 提供数据库连接就绪状态，测试环境可以不注入。 */
    @Optional() @Inject(DataSource) private readonly dataSource?: DataSource
  ) {}

  /**
   * 返回应用存活状态。
   *
   * @returns 表示进程存活的状态数据。
   */
  getHealth() {
    return {
      status: 'ok' as const,
      environment: this.configService.get<string>('app.environment', 'development')
    };
  }

  /**
   * 检查配置和数据库依赖是否可用。
   *
   * @returns 当前应用及其数据库依赖的就绪状态。
   */
  async getReadiness() {
    const databaseEnabled = this.configService.get<boolean>('database.enabled', false);
    const databaseReady = !databaseEnabled || Boolean(this.dataSource?.isInitialized);
    return {
      status: databaseReady ? ('ready' as const) : ('not_ready' as const),
      checks: {
        database: databaseReady ? ('up' as const) : ('down' as const)
      }
    };
  }
}
