import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '#/app.module.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { WECHAT_LOGIN_PROVIDER } from '#/modules/auth/user/providers/wechat-login.provider.js';
import type { WechatLoginProvider } from '#/modules/auth/user/providers/wechat-login.provider.js';
import { hashPassword } from '#/common/utils/password-hash.util.js';
import { encryptPassword } from './password.js';
import { createTestPassword } from './fixtures.js';

describe('微信用户认证与资料功能', () => {
  let app: INestApplication;
  let exchangeCode: WechatLoginProvider['exchangeCode'];
  let adminRepository: AdminRepository;
  let publicKey: string;
  let adminPassword: string;

  beforeEach(async () => {
    exchangeCode = vi.fn(async (_code: string) => ({ openId: 'openid-1', unionId: 'unionid-1' }));
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(WECHAT_LOGIN_PROVIDER)
      .useValue({ exchangeCode } satisfies WechatLoginProvider)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createStrictValidationPipe());
    await app.init();
    adminRepository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    adminPassword = createTestPassword('admin');
    const credentials = await hashPassword(adminPassword);
    await adminRepository.create({
      username: 'admin',
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt,
      isRoot: true
    });
    publicKey = (await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200)).body.data.publicKey;
  });

  afterEach(async () => {
    await app.close();
  });

  async function loginAdmin(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: encryptPassword(publicKey, adminPassword) })
      .expect(200);
    return response.body.data.accessToken as string;
  }

  it('使用微信 code 创建用户并返回可读取资料的访问令牌', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: ' 微信用户 ', avatarUrl: 'https://example.com/avatar.png' })
      .expect(200);

    expect(login.body).toMatchObject({
      code: 0,
      data: { tokenType: 'Bearer', user: { nickname: '微信用户', role: 'user' } }
    });
    expect(exchangeCode).toHaveBeenCalledWith('wechat-code');

    const profile = await request(app.getHttpServer())
      .get('/api/user/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);
    expect(profile.body).toMatchObject({
      code: 0,
      data: { nickname: '微信用户', avatarUrl: 'https://example.com/avatar.png', isActive: true }
    });
  });

  it('同一微信身份再次登录更新展示资料而不是创建第二个账号', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: '第一次' })
      .expect(200);
    const second = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: '第二次' })
      .expect(200);

    expect(second.body.data.user.id).toBe(first.body.data.user.id);
    expect(second.body.data.user.nickname).toBe('第二次');
  });

  it('注销撤销用户刷新令牌，用户不能访问管理员接口', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: '普通用户' })
      .expect(200);
    const refreshToken = login.body.data.refreshToken as string;

    await request(app.getHttpServer()).post('/api/auth/user/logout').send({ refreshToken }).expect(200);
    const refresh = await request(app.getHttpServer())
      .post('/api/auth/user/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(refresh.body).toMatchObject({ code: 40101, data: null });

    const forbidden = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);
    expect(forbidden.body).toMatchObject({ code: 40300, data: null });
  });

  it('管理员可以查询并停用用户，停用后的用户资料访问被拒绝', async () => {
    const userLogin = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: '待停用用户' })
      .expect(200);
    const adminToken = await loginAdmin();

    const list = await request(app.getHttpServer())
      .get('/api/user/list')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const user = list.body.data.items.find((item: { nickname: string }) => item.nickname === '待停用用户');
    expect(user).toBeDefined();

    const updated = await request(app.getHttpServer())
      .post('/api/user/update')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: user.id, isActive: false })
      .expect(200);
    expect(updated.body).toMatchObject({ code: 0, data: { id: user.id, isActive: false } });

    const profile = await request(app.getHttpServer())
      .get('/api/user/me')
      .set('Authorization', `Bearer ${userLogin.body.data.accessToken}`)
      .expect(200);
    expect(profile.body).toMatchObject({ code: 40100, data: null });
  });
});
