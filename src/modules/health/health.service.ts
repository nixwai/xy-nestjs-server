import { Optional, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/** 提供进程和依赖就绪状态。 */
@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  /** 返回应用存活状态。 */
  getHealth() {
    return {
      status: 'ok' as const,
      environment: this.configService.get<string>(
        'app.environment',
        'development',
      ),
    };
  }

  /** 检查配置和数据库依赖是否可用。 */
  async getReadiness() {
    const databaseEnabled = this.configService.get<boolean>(
      'database.enabled',
      false,
    );
    const databaseReady =
      !databaseEnabled || Boolean(this.dataSource?.isInitialized);
    return {
      status: databaseReady ? ('ready' as const) : ('not_ready' as const),
      checks: {
        database: databaseReady ? ('up' as const) : ('down' as const),
      },
    };
  }
}
