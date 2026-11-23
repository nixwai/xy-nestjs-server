import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createE2eApplication } from './test-app.js';

describe('健康检查功能', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createE2eApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('公开返回存活状态和统一成功响应', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toMatchObject({ code: 0, message: 'success', data: { status: 'ok', environment: 'test' } });
  });

  it('在测试环境不依赖数据库返回就绪状态', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/ready').expect(200);

    expect(response.body).toMatchObject({ code: 0, data: { status: 'ready' } });
  });
});
