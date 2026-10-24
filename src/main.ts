import { Logger } from '@nestjs/common';
import { bootstrap } from './bootstrap.js';

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application failed to start', error);
  process.exitCode = 1;
});
