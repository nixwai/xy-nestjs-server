import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

/** 健康检查模块。 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
