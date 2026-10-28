import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createTestModule } from '../test/e2e/create-test-module.js';

/** 使用测试环境配置生成 OpenAPI 文档，避免连接真实数据库。 */
process.env.NODE_ENV = 'test';
process.env.DB_ENABLED = 'false';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-chars';

const moduleRef = await createTestModule().compile();
const app = moduleRef.createNestApplication();
await app.init();
const config = new DocumentBuilder()
  .setTitle('Scenic Guide Booking API')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
writeFileSync(
  join(process.cwd(), 'openapi.json'),
  JSON.stringify(document, null, 2),
);
await app.close();
