import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestModule } from './create-test-module.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import { hashPassword } from '#/modules/auth/utils/password.util.js';
import { encryptPassword } from './password-transport.js';

describe('素材文件夹管理 API (e2e)', () => {
  let app: INestApplication;
  let repository: AdminRepository;
  let publicKey: string;
  let ownerId: string;
  let otherOwnerId: string;
  let rootId: string;
  const ownerPermissions = new Set(Object.values(PermissionCode));
  let grantedPermissions = new Set<string>(ownerPermissions);

  beforeEach(async () => {
    const moduleRef = await createTestModule().compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createStrictValidationPipe());
    await app.init();
    repository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const password = await hashPassword('Asset1234');
    const root = await repository.create({
      username: 'asset-root',
      passwordHash: password.hash,
      passwordSalt: password.salt,
      isRoot: true
    });
    const owner = await repository.create({
      username: 'asset-owner',
      passwordHash: password.hash,
      passwordSalt: password.salt
    });
    const other = await repository.create({
      username: 'asset-other',
      passwordHash: password.hash,
      passwordSalt: password.salt
    });
    rootId = root.id;
    ownerId = owner.id;
    otherOwnerId = other.id;
    grantedPermissions = new Set(ownerPermissions);
    vi.spyOn(app.get(AuthorizationService), 'hasPermission').mockImplementation(async (id, code) => {
      return id === rootId || grantedPermissions.has(code);
    });
    const keyResponse = await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200);
    publicKey = keyResponse.body.data.publicKey as string;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  async function login(username: string): Promise<string> {
    const result = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username, password: encryptPassword(publicKey, 'Asset1234') })
      .expect(200);
    return result.body.data.accessToken as string;
  }

  it('支持创建多级文件夹并返回账号根节点', async () => {
    const token = await login('asset-owner');
    const root = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '文件夹A' })
      .expect(200);
    const child = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '文件夹B', parentId: root.body.data.id })
      .expect(200);
    expect(child.body.data).toMatchObject({ ownerId, creatorId: ownerId, parentId: root.body.data.id });
    const tree = await request(app.getHttpServer())
      .get('/api/asset/folder/tree')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(tree.body.data.owners).toHaveLength(1);
    const ownerTree = tree.body.data.owners.find((item: { owner: { id: string } }) => item.owner.id === ownerId);
    const folderA = ownerTree?.children.find((item: { name: string }) => item.name === '文件夹A');

    expect(ownerTree).toMatchObject({ owner: { id: ownerId, username: 'asset-owner' } });
    expect(folderA?.children.find((item: { name: string }) => item.name === '文件夹B')).toBeDefined();
  });

  it('普通用户不能查看或修改其他拥有者，根管理员可以查看全部', async () => {
    const rootToken = await login('asset-root');
    const created = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ name: '他人目录', ownerId: otherOwnerId })
      .expect(200);
    const ownerToken = await login('asset-owner');
    const updated = await request(app.getHttpServer())
      .post('/api/asset/folder/update')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ id: created.body.data.id, name: '全局权限可更新' })
      .expect(200);
    expect(updated.body.data).toMatchObject({ id: created.body.data.id, name: '全局权限可更新' });

    grantedPermissions.delete(PermissionCode.ASSET_FOLDER_ALL);
    const deniedAll = await request(app.getHttpServer())
      .get('/api/asset/folder/tree/all')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(deniedAll.body.code).toBe(40300);
    const deniedUpdate = await request(app.getHttpServer())
      .post('/api/asset/folder/update')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ id: created.body.data.id, name: '越权目录' })
      .expect(200);
    expect(deniedUpdate.body.code).toBe(40300);
    const all = await request(app.getHttpServer())
      .get('/api/asset/folder/tree/all')
      .set('Authorization', `Bearer ${rootToken}`)
      .expect(200);
    const ownerIds = all.body.data.owners.map((item: { owner: { id: string } }) => item.owner.id);
    expect(ownerIds).toEqual([otherOwnerId]);
    const otherOwnerTree = all.body.data.owners.find(
      (item: { owner: { id: string } }) => item.owner.id === otherOwnerId
    );
    expect(otherOwnerTree?.children.map((item: { name: string }) => item.name)).toContain('全局权限可更新');
  });

  it('同级重名和删除非空文件夹返回业务错误', async () => {
    const token = await login('asset-owner');
    const root = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '父目录' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '子目录', parentId: root.body.data.id })
      .expect(200);
    const duplicate = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '父目录' })
      .expect(200);
    expect(duplicate.body.code).toBe(40900);
    const notEmpty = await request(app.getHttpServer())
      .post('/api/asset/folder/soft-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: root.body.data.id })
      .expect(200);
    expect(notEmpty.body.code).toBe(40900);
  });

  it('未登录与非法参数不会进入业务处理', async () => {
    const anonymous = await request(app.getHttpServer()).get('/api/asset/folder/tree').expect(200);
    expect(anonymous.body).toMatchObject({ code: 40100, data: null });

    const token = await login('asset-owner');
    const blankName = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' })
      .expect(200);
    expect(blankName.body.code).toBe(40001);

    const unknownField = await request(app.getHttpServer())
      .post('/api/asset/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '合法名称', adminId: '1' })
      .expect(200);
    expect(unknownField.body.code).toBe(40001);

    const invalidId = await request(app.getHttpServer())
      .post('/api/asset/folder/soft-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'not-a-number' })
      .expect(200);
    expect(invalidId.body.code).toBe(40001);
  });

  it('文件夹不存在时返回资源不存在', async () => {
    const token = await login('asset-owner');
    const missing = await request(app.getHttpServer())
      .post('/api/asset/folder/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '999999', name: '不存在的目录' })
      .expect(200);
    expect(missing.body.code).toBe(40400);
  });
});
