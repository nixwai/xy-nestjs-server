import { loadEnvironment } from '../src/config/environment.js';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSwaggerConfig } from '../src/common/swagger/swagger.config.js';
import type { AppConfig } from '../src/config/config.types.js';
/** 使用测试环境配置生成 OpenAPI 文档，避免连接真实数据库。 */
process.env.NODE_ENV = 'test';
process.env.DB_ENABLED = 'false';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-chars';
loadEnvironment({ environment: 'test' });

const { createTestModule } = await import('../test/e2e/create-test-module.js');
const moduleRef = await createTestModule().compile();
const app = moduleRef.createNestApplication();
await app.init();
const appConfig = app.get(ConfigService).getOrThrow<AppConfig>('app');
const document = SwaggerModule.createDocument(app, createSwaggerConfig(appConfig.globalPrefix));
writeFileSync(join(process.cwd(), 'openapi.json'), JSON.stringify(document, null, 2));
await app.close();
