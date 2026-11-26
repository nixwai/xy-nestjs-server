import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResourceUrlService } from './resource-url.service.js';

/** 提供跨业务复用的资源公开地址生成能力。 */
@Module({
  imports: [ConfigModule],
  providers: [ResourceUrlService],
  exports: [ResourceUrlService]
})
export class ResourceUrlModule {}
