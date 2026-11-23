import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createE2eApplication } from './test-app.js';
import { encryptPassword } from './password.js';
import { createTestPassword } from './fixtures.js';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { hashPassword } from '#/common/utils/password-hash.util.js';

describe('管理员认证功能', () => {
  let app: INestApplication;
  let repository: AdminRepository;
  let publicKey: string;
  let adminPassword: string;

  beforeEach(async () => {
    app = await createE2eApplication();
    repository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const keyResponse = await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200);
    publicKey = keyResponse.body.data.publicKey as string;
    adminPassword = createTestPassword('admin');
    const credentials = await hashPassword(adminPassword);
    await repository.create({ username: 'admin', passwordHash: credentials.hash, passwordSalt: credentials.salt });
  });

  afterEach(async () => {
    await app.close();
  });

  it('公开返回可用于 OAEP-SHA256 密码传输的公钥', async () => {
    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(publicKey).toContain('END PUBLIC KEY');
  });

  it('拒绝明文密码、错误密码和不存在账号', async () => {
    const plaintext = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: adminPassword })
      .expect(200);
    expect(plaintext.body).toMatchObject({ code: 40001, data: null, message: '密码密文必须是 Base64 字符串' });

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: encryptPassword(publicKey, `${adminPassword}-wrong`) })
      .expect(200);
    expect(wrongPassword.body).toMatchObject({ code: 40100, data: null, message: '用户名或密码错误' });

    const missingUser = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'missing', password: encryptPassword(publicKey, adminPassword) })
      .expect(200);
    expect(missingUser.body).toMatchObject({ code: 40100, data: null });
  });

  it('登录后轮换刷新令牌，旧令牌重放会使会话族失效', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: encryptPassword(publicKey, adminPassword) })
      .expect(200);
    expect(login.body).toMatchObject({
      code: 0,
      data: { tokenType: 'Bearer', admin: { username: 'admin', role: 'admin', isRoot: false } }
    });

    const firstRefreshToken = login.body.data.refreshToken as string;
    const firstRefresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(200);
    expect(firstRefresh.body.code).toBe(0);
    const secondRefreshToken = firstRefresh.body.data.refreshToken as string;
    expect(secondRefreshToken).not.toBe(firstRefreshToken);

    const replay = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(200);
    expect(replay.body).toMatchObject({ code: 40101, data: null });

    const familyInvalidated = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: secondRefreshToken })
      .expect(200);
    expect(familyInvalidated.body).toMatchObject({ code: 40101, data: null });
  });

  it('注销幂等且注销后的刷新令牌不能再次使用', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: encryptPassword(publicKey, adminPassword) })
      .expect(200);
    const refreshToken = login.body.data.refreshToken as string;

    const firstLogout = await request(app.getHttpServer()).post('/api/auth/logout').send({ refreshToken }).expect(200);
    const secondLogout = await request(app.getHttpServer()).post('/api/auth/logout').send({ refreshToken }).expect(200);
    expect(firstLogout.body).toEqual({ code: 0, message: 'success', data: null });
    expect(secondLogout.body).toEqual({ code: 0, message: 'success', data: null });

    const refresh = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken }).expect(200);
    expect(refresh.body).toMatchObject({ code: 40101, data: null });
  });

  it('缺失刷新令牌字段时在 HTTP 边界返回参数错误', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/refresh').send({}).expect(200);

    expect(response.body).toMatchObject({ code: 40001, data: null });
  });
});
