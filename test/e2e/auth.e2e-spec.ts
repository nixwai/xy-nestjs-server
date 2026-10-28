import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestModule } from './create-test-module.js';
import { ADMIN_REPOSITORY } from '../../src/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '../../src/modules/admin/repositories/admin-repository.port.js';
import { hashPassword } from '../../src/modules/auth/utils/password.util.js';

const versionHeader = 'application/vnd.scenic.v1+json';

describe('Admin authentication API (e2e)', () => {
  let app: INestApplication;
  let repository: AdminRepository;

  beforeEach(async () => {
    const moduleRef = await createTestModule().compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    repository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const { hash, salt } = await hashPassword('Admin1234');
    await repository.create({
      username: 'admin',
      passwordHash: hash,
      passwordSalt: salt,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs in, rotates a refresh token, and logs out', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .set('Accept', versionHeader)
      .send({ username: 'admin', password: 'Admin1234' })
      .expect(200);
    expect(login.body).toMatchObject({
      code: 0,
      data: {
        admin: { username: 'admin', role: 'admin' },
        tokenType: 'Bearer',
      },
    });

    const firstRefreshToken = login.body.data.refreshToken as string;
    const refresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Accept', versionHeader)
      .send({ refreshToken: firstRefreshToken })
      .expect(200);
    expect(refresh.body.data.refreshToken).not.toBe(firstRefreshToken);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Accept', versionHeader)
      .send({ refreshToken: refresh.body.data.refreshToken })
      .expect(200);
    const afterLogout = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Accept', versionHeader)
      .send({ refreshToken: refresh.body.data.refreshToken })
      .expect(200);
    expect(afterLogout.body).toMatchObject({ code: 40100, data: null });
  });

  it('rejects requests without the required API version header', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: 'Admin1234' })
      .expect(200);
    expect(response.body).toMatchObject({ code: 40002, data: null });
  });
});
