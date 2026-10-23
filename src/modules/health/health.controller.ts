import { Controller, Get } from '@nestjs/common';
import { SkipApiVersion } from '../../common/decorators/index.js';
import { HealthService } from './health.service.js';

/** 提供容器存活和就绪探针。 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** 返回应用存活状态。 */
  @Get()
  @SkipApiVersion()
  getHealth() {
    return this.healthService.getHealth();
  }

  /** 返回应用依赖就绪状态。 */
  @Get('ready')
  @SkipApiVersion()
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
