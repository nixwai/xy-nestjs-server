import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordTransportService } from './password-transport.service.js';

/** 提供密码传输加密基础设施。 */
@Module({
  imports: [ConfigModule],
  providers: [PasswordTransportService],
  exports: [PasswordTransportService]
})
export class SecurityModule {}
