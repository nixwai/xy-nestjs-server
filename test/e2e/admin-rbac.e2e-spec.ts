import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { PERMISSION_REPOSITORY } from '#/modules/permission/repositories/permission-repository.port.js';
import type { PermissionRepository } from '#/modules/permission/repositories/permission-repository.port.js';
import { ROLE_REPOSITORY } from '#/modules/role/repositories/role-repository.port.js';
import type { RoleRepository } from '#/modules/role/repositories/role-repository.port.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import { createE2eApplication } from './test-app.js';
import { allAssetPermissions, createTestPassword, grantPermissions, seedAdmin } from './fixtures.js';
import { encryptPassword } from './password.js';

describe('管理员授权与管理功能', () => {
  let app: INestApplication;
  let adminRepository: AdminRepository;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let publicKey: string;
  let rootToken: string;
  let operatorToken: string;
  let rootPassword: string;
  let operatorPassword: string;

  beforeEach(async () => {
    app = await createE2eApplication();
    adminRepository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    roleRepository = app.get<RoleRepository>(ROLE_REPOSITORY);
    permissionRepository = app.get<PermissionRepository>(PERMISSION_REPOSITORY);
    publicKey = (await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200)).body.data.publicKey;

    rootPassword = createTestPassword('root');
    operatorPassword = createTestPassword('operator');
    const rootId = await seedAdmin(adminRepository, 'root', rootPassword, true);
    const operatorId = await seedAdmin(adminRepository, 'operator', operatorPassword);
    await grantPermissions(
      adminRepository,
      roleRepository,
      permissionRepository,
      operatorId,
      allAssetPermissions(),
      'asset'
    );
    await grantPermissions(
      adminRepository,
      roleRepository,
      permissionRepository,
      operatorId,
      [PermissionCode.USER_READ, PermissionCode.USER_UPDATE],
      'user'
    );
    expect(rootId).toBeTruthy();

    rootToken = await login('root', rootPassword);
    operatorToken = await login('operator', operatorPassword);
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(username: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username, password: encryptPassword(publicKey, password) })
      .expect(200);
    expect(response.body.code).toBe(0);
    return response.body.data.accessToken as string;
  }

  it('未认证请求返回稳定的未登录业务码', async () => {
    const response = await request(app.getHttpServer()).get('/api/admin/me').expect(200);

    expect(response.body).toMatchObject({ code: 40100, data: null, message: '请先登录' });
  });

  it('根管理员可以查看管理员列表，普通管理员不能访问根管理员接口', async () => {
    const rootResponse = await request(app.getHttpServer())
      .get('/api/admin/list')
      .set('Authorization', `Bearer ${rootToken}`)
      .expect(200);
    expect(rootResponse.body.code).toBe(0);
    expect(rootResponse.body.data.items.map((item: { username: string }) => item.username)).toEqual([
      'operator',
      'root'
    ]);

    const operatorResponse = await request(app.getHttpServer())
      .get('/api/admin/list')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    expect(operatorResponse.body).toMatchObject({ code: 40300, data: null });
  });

  it('令牌失效、角色不匹配和未授予动态权限时分别拒绝请求', async () => {
    const malformed = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Authorization', 'Bearer malformed-token')
      .expect(200);
    expect(malformed.body).toMatchObject({ code: 40100, data: null });

    const denied = await request(app.getHttpServer())
      .get('/api/audit/list')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    expect(denied.body).toMatchObject({ code: 40300, data: null });
  });

  it('根管理员可以读取审计筛选项，未授权管理员不能读取', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api/audit/options')
      .set('Authorization', `Bearer ${rootToken}`)
      .expect(200);
    expect(allowed.body).toMatchObject({
      code: 0,
      data: {
        actions: expect.arrayContaining([{ value: 'admin.create', label: '创建管理员' }]),
        resources: expect.arrayContaining([{ value: 'admin', label: '管理员' }]),
        results: [
          { value: 'succeeded', label: '成功' },
          { value: 'failed', label: '失败' }
        ]
      }
    });

    const denied = await request(app.getHttpServer())
      .get('/api/audit/options')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    expect(denied.body).toMatchObject({ code: 40300, data: null });
  });

  it('动态权限允许访问对应资源，禁用权限后立即失效', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api/asset/folder/tree')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    expect(allowed.body).toMatchObject({ code: 0, data: { owners: expect.any(Array) } });

    const permission = await permissionRepository.findByCode(PermissionCode.ASSET_FOLDER_READ);
    expect(permission).not.toBeNull();
    await permissionRepository.setActive(permission!.id, false);

    const denied = await request(app.getHttpServer())
      .get('/api/asset/folder/tree')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    expect(denied.body).toMatchObject({ code: 40300, data: null });
  });

  it('严格校验拒绝未知字段和空名称', async () => {
    const unknownField = await request(app.getHttpServer())
      .post('/api/admin/create')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ username: 'new-admin', password: 'not-encrypted', isRoot: false, unexpected: true })
      .expect(200);
    expect(unknownField.body).toMatchObject({ code: 40001, data: null });

    const blankName = await request(app.getHttpServer())
      .post('/api/admin/create')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ username: '   ', password: 'not-encrypted', isRoot: false })
      .expect(200);
    expect(blankName.body).toMatchObject({ code: 40001, data: null });
  });

  it('根管理员查询返回公开字段，不泄露密码材料', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${rootToken}`)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data).toMatchObject({ username: 'root', isRoot: true });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data).not.toHaveProperty('passwordSalt');
  });
});
