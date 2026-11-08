import { Logger } from '@nestjs/common';
import { bootstrap } from './bootstrap.js';
/** 启动应用并将启动失败记录到日志。 */
void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application failed to start', error);
  process.exitCode = 1;
});
