import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

process.env.NODE_ENV = 'test';
process.env.DB_ENABLED = 'false';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-chars';

const { createApplication } = await import('../src/bootstrap.js');
const app = await createApplication();
const config = new DocumentBuilder()
  .setTitle('Scenic Guide Booking API')
  .setVersion('1.0.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
writeFileSync(
  join(process.cwd(), 'openapi.json'),
  JSON.stringify(document, null, 2),
);
await app.close();
