import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '../../common/decorators/index.js';
import { Public } from '../authorization/decorators/index.js';
import { HealthResponseDto, ReadinessResponseDto } from './dto/index.js';
import { HealthService } from './health.service.js';

/** 提供容器存活和依赖就绪探针。 */
@ApiTags('健康检查')
@ApiCommonResponses()
@Controller('health')
@Public()
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  /** 返回应用进程存活状态。 */
  @Get()
  @ApiOperation({
    summary: '存活检查',
    description: '用于容器和负载均衡器确认应用进程仍在运行。'
  })
  @ApiOkResponseData(HealthResponseDto, { description: '应用存活状态。' })
  getHealth() {
    return this.healthService.getHealth();
  }

  /** 检查应用及其数据库依赖是否就绪。 */
  @Get('ready')
  @ApiOperation({
    summary: '就绪检查',
    description: '用于确认应用依赖是否可用；数据库未启用时视为就绪。'
  })
  @ApiOkResponseData(ReadinessResponseDto, {
    description: '应用依赖就绪状态。'
  })
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
