import { SwaggerModule } from '@nestjs/swagger';
import { createTestModule } from '../e2e/create-test-module.js';
import { createSwaggerConfig } from '../../src/common/swagger/swagger.config.js';

describe('OpenAPI 文档', () => {
  it('应完整描述接口说明、请求体和统一响应', async () => {
    const moduleRef = await createTestModule().compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const document = SwaggerModule.createDocument(app, createSwaggerConfig());
    const operations = Object.entries(document.paths).flatMap(
      ([path, pathItem]) =>
        Object.entries(pathItem)
          .filter(([method]) =>
            ['get', 'post', 'put', 'patch', 'delete'].includes(method),
          )
          .map(([method, operation]) => ({
            path,
            method,
            operation: operation as {
              summary?: string;
              description?: string;
              requestBody?: unknown;
              parameters?: Array<{ name?: string }>;
              responses?: Record<string, { content?: unknown }>;
            },
          })),
    );

    expect(document.servers).toEqual([
      { url: '/api', description: '当前环境 API 根路径' },
    ]);
    expect(operations).not.toHaveLength(0);
    expect(operations.every(({ operation }) => operation.summary)).toBe(true);
    expect(
      operations.every(
        ({ operation }) => operation.responses?.['200']?.content,
      ),
    ).toBe(true);

    for (const { path, method, operation } of operations) {
      if (method === 'post') {
        expect(
          operation.requestBody,
          `${method.toUpperCase()} ${path}`,
        ).toBeDefined();
      }
    }

    expect(document.components?.schemas).toHaveProperty('ApiErrorResponseDto');
    expect(document.components?.schemas).toHaveProperty('AdminResponseDto');
    expect(document.components?.schemas).toHaveProperty('RoleResponseDto');
    expect(document.components?.schemas).toHaveProperty(
      'PermissionResponseDto',
    );
    expect(document.components?.schemas).toHaveProperty('AuditLogResponseDto');

    await app.close();
  });
});
