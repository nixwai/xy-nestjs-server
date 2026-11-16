import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestModule } from './create-test-module.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';
import { encryptPassword } from './password-transport.js';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { hashPassword } from '#/modules/auth/admin/utils/password.util.js';
import { WECHAT_LOGIN_PROVIDER } from '#/modules/auth/user/providers/wechat-login.provider.js';
import type { WechatLoginProvider } from '#/modules/auth/user/providers/wechat-login.provider.js';

/** 管理员登录并返回访问令牌。 */
async function loginAdmin(app: INestApplication): Promise<string> {
  const publicKey = (await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200)).body.data
    .publicKey as string;
  const response = await request(app.getHttpServer())
    .post('/api/auth/admin/login')
    .send({ username: 'admin', password: encryptPassword(publicKey, 'Admin1234') })
    .expect(200);
  expect(response.body.code).toBe(0);
  return response.body.data.accessToken as string;
}

describe('Wechat user API (e2e)', () => {
  let app: INestApplication;
  let adminRepository: AdminRepository;
  let wechatProvider: WechatLoginProvider;
  let exchangeCodeMock: WechatLoginProvider['exchangeCode'];

  beforeEach(async () => {
    exchangeCodeMock = vi.fn(async (_code: string) => ({ openId: 'openid-1', unionId: 'unionid-1' }));
    wechatProvider = { exchangeCode: exchangeCodeMock };
    const moduleRef = await createTestModule()
      .overrideProvider(WECHAT_LOGIN_PROVIDER)
      .useValue(wechatProvider)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createStrictValidationPipe());
    await app.init();
    adminRepository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const { hash, salt } = await hashPassword('Admin1234');
    await adminRepository.create({ username: 'admin', passwordHash: hash, passwordSalt: salt, isRoot: true });
  });

  afterEach(async () => {
    await app.close();
  });

  it('通过 uni.login code 登录并读取当前用户资料', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: '微信用户', avatarUrl: 'https://example.com/avatar.png' })
      .expect(200);

    expect(login.body).toMatchObject({
      code: 0,
      data: {
        tokenType: 'Bearer',
        user: { nickname: '微信用户', avatarUrl: 'https://example.com/avatar.png', role: 'user' }
      }
    });
    expect(exchangeCodeMock).toHaveBeenCalledWith('wechat-code');

    const profile = await request(app.getHttpServer())
      .get('/api/user/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);
    expect(profile.body).toMatchObject({
      code: 0,
      data: { nickname: '微信用户', avatarUrl: 'https://example.com/avatar.png', isActive: true }
    });
  });

  it('拒绝微信用户访问后台用户管理接口，并允许管理员停用用户', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'wechat-code', nickname: '微信用户' })
      .expect(200);
    const userToken = login.body.data.accessToken as string;
    const adminToken = await loginAdmin(app);

    const adminProfile = await request(app.getHttpServer())
      .get('/api/user/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminProfile.body).toMatchObject({ code: 40300, data: null });

    const forbidden = await request(app.getHttpServer())
      .get('/api/user/list')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(forbidden.body).toMatchObject({ code: 40300, data: null });
    const upload = await request(app.getHttpServer())
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(upload.body).toMatchObject({ code: 40300, data: null });

    const list = await request(app.getHttpServer())
      .get('/api/user/list')
      .query({ keyword: '微信', page: 1, pageSize: 20 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body).toMatchObject({ code: 0, data: { total: 1, items: [{ nickname: '微信用户', isActive: true }] } });
    const userId = list.body.data.items[0].id as string;

    const updated = await request(app.getHttpServer())
      .post('/api/user/update')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: userId, isActive: false })
      .expect(200);
    expect(updated.body).toMatchObject({ code: 0, data: { id: userId, isActive: false } });

    const disabled = await request(app.getHttpServer())
      .get('/api/user/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(disabled.body).toMatchObject({ code: 40100, data: null });
  });

  it('非开发环境不暴露开发登录接口', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/dev/login')
      .send({ nickname: 'H5开发用户' })
      .expect(200);

    expect(response.body).toMatchObject({ code: 40400, data: null });
  });

  it('未携带令牌时拒绝当前用户资料接口', async () => {
    const response = await request(app.getHttpServer()).get('/api/user/me').expect(200);
    expect(response.body).toMatchObject({ code: 40100, data: null });
  });
});
