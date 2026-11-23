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

describe('素材文件夹管理功能', () => {
  let app: INestApplication;
  let adminRepository: AdminRepository;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let publicKey: string;
  let ownerToken: string;
  let limitedToken: string;
  let rootToken: string;
  let ownerPassword: string;
  let limitedPassword: string;
  let rootPassword: string;

  beforeEach(async () => {
    app = await createE2eApplication();
    adminRepository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    roleRepository = app.get<RoleRepository>(ROLE_REPOSITORY);
    permissionRepository = app.get<PermissionRepository>(PERMISSION_REPOSITORY);
    publicKey = (await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200)).body.data.publicKey;

    ownerPassword = createTestPassword('owner');
    limitedPassword = createTestPassword('limited');
    rootPassword = createTestPassword('root');
    await seedAdmin(adminRepository, 'asset-owner', ownerPassword);
    const limitedId = await seedAdmin(adminRepository, 'asset-limited', limitedPassword);
    await seedAdmin(adminRepository, 'asset-root', rootPassword, true);
    await grantPermissions(adminRepository, roleRepository, permissionRepository, '1', allAssetPermissions(), 'owner');
    await grantPermissions(
      adminRepository,
      roleRepository,
      permissionRepository,
      limitedId,
      [PermissionCode.ASSET_FOLDER_READ, PermissionCode.ASSET_FOLDER_CREATE],
      'limited'
    );

    ownerToken = await login('asset-owner', ownerPassword);
    limitedToken = await login('asset-limited', limitedPassword);
    rootToken = await login('asset-root', rootPassword);
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(username: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username, password: encryptPassword(publicKey, password) })
      .expect(200);
    return response.body.data.accessToken as string;
  }

  it('创建和重命名文件夹后，树结构保留父子关系', async () => {
    const root = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '素材根目录' })
      .expect(200);
    const child = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '图片', parentId: root.body.data.id })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/asset/folder/update')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ id: child.body.data.id, name: '图片素材' })
      .expect(200);

    const tree = await request(app.getHttpServer())
      .get('/api/asset/folder/tree')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const owner = tree.body.data.owners.find(
      (item: { owner: { username: string } }) => item.owner.username === 'asset-owner'
    );
    expect(owner.children).toEqual([
      expect.objectContaining({
        id: root.body.data.id,
        name: '素材根目录',
        children: [expect.objectContaining({ id: child.body.data.id, name: '图片素材' })]
      })
    ]);
  });

  it('拒绝同级重名、删除非空目录和不存在资源', async () => {
    const root = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '重复目录' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '子目录', parentId: root.body.data.id })
      .expect(200);

    const duplicate = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '重复目录' })
      .expect(200);
    expect(duplicate.body).toMatchObject({ code: 40900, data: null });

    const notEmpty = await request(app.getHttpServer())
      .post('/api/asset/folder/soft-delete')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ id: root.body.data.id })
      .expect(200);
    expect(notEmpty.body).toMatchObject({ code: 40900, data: null });

    const missing = await request(app.getHttpServer())
      .post('/api/asset/folder/update')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ id: '999999', name: '不存在' })
      .expect(200);
    expect(missing.body).toMatchObject({ code: 40400, data: null });
  });

  it('缺少全局权限时只能读取本人树，不能查询全部树或更新他人目录', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ name: '根管理员代建', ownerId: '1' })
      .expect(200);

    const allTree = await request(app.getHttpServer())
      .get('/api/asset/folder/tree/all')
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(200);
    expect(allTree.body).toMatchObject({ code: 40300, data: null });

    const update = await request(app.getHttpServer())
      .post('/api/asset/folder/update')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ id: created.body.data.id, name: '越权修改' })
      .expect(200);
    expect(update.body).toMatchObject({ code: 40300, data: null });
  });

  it('严格校验拒绝空名称、未知字段和非法 ID', async () => {
    const blank = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '   ' })
      .expect(200);
    expect(blank.body).toMatchObject({ code: 40001, data: null });

    const unknown = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: '合法', adminId: 'other-field' })
      .expect(200);
    expect(unknown.body).toMatchObject({ code: 40001, data: null });

    const invalidId = await request(app.getHttpServer())
      .post('/api/asset/folder/soft-delete')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ id: '' })
      .expect(200);
    expect(invalidId.body).toMatchObject({ code: 40001, data: null });
  });
});
