import type { INestApplication } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestModule } from './create-test-module.js';
import { encryptPassword } from './password-transport.js';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { hashPassword } from '#/modules/auth/utils/password.util.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';
import { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import { UploadService } from '#/modules/upload/upload.service.js';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { ImageConfig } from '#/config/config.types.js';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6XcAAAAASUVORK5CYII=',
  'base64'
);

describe('素材 HTTP 契约 (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let rootToken: string;
  let ownerId: string;
  let rootId: string;
  let permissions: Set<string>;
  const upload = vi.fn();

  beforeEach(async () => {
    permissions = new Set(
      Object.values(PermissionCode).filter(code => code.startsWith('asset.') && !code.endsWith('read-all'))
    );
    let key = 0;
    upload.mockReset().mockImplementation(async () => ({
      url: `https://example.invalid/${++key}.png`,
      storageKey: `${key}.png`,
      category: 'asset',
      mimeType: 'image/png',
      size: png.length,
      width: 1,
      height: 1
    }));
    const moduleRef = await createTestModule()
      .overrideProvider(UploadService)
      .useValue({
        uploadImage: upload,
        validateBatch: (files: unknown[]) => {
          if (!files.length) throw new BadRequestException('请选择要上传的图片');
        },
        deleteObject: vi.fn().mockResolvedValue(undefined),
        getMemoryBudget: () => 64 * 1024 * 1024
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createStrictValidationPipe());
    await app.init();
    const repository = app.get<AdminRepository>(ADMIN_REPOSITORY);
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
    rootId = root.id;
    ownerId = owner.id;
    const auth = app.get(AuthorizationService);
    vi.spyOn(auth, 'hasPermission').mockImplementation(async (id, code) => id === rootId || permissions.has(code));
    const publicKeyResponse = await request(app.getHttpServer()).get('/api/auth/admin/public-key');
    const login = async (username: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/admin/login')
        .send({
          username,
          password: encryptPassword(publicKeyResponse.body.data.publicKey as string, 'Asset1234')
        });
      expect(response.body.code).toBe(0);
      return response.body.data.accessToken as string;
    };
    token = await login('asset-owner');
    rootToken = await login('asset-root');
  });
  it('上传限制接口使用上传动作权限并返回当前配置', async () => {
    const config = app.get(ConfigService).getOrThrow<ImageConfig>(CONFIG_KEYS.image);
    const response = await request(app.getHttpServer())
      .get('/api/asset/upload-limits')
      .set('Authorization', `Bearer ${token}`);
    expect(response.body.data).toEqual({
      maxFiles: config.maxFiles,
      maxFileSize: config.maxFileSize,
      maxBatchSize: 64 * 1024 * 1024
    });
    permissions.delete(PermissionCode.ASSET_IMAGE_UPLOAD);
    const denied = await request(app.getHttpServer())
      .get('/api/asset/upload-limits')
      .set('Authorization', `Bearer ${token}`);
    expect(denied.body.code).not.toBe(0);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app?.close();
  });

  const api = () => request(app.getHttpServer());
  const auth = (value = token) => `Bearer ${value}`;
  async function folder(name = '图片', extra = {}, value = token) {
    const result = await api()
      .post('/api/asset/folders')
      .set('Authorization', auth(value))
      .send({ name, ...extra });
    expect(result.body.code).toBe(0);
    return result.body.data as { id: string; ownerId: string; createdByAdminId: string; name: string };
  }
  async function image(folderId?: string) {
    const call = api().post('/api/asset/images/batch').set('Authorization', auth());
    if (folderId) call.field('folderId', folderId);
    const result = await call.attach('files', png, 'image.png');
    expect(result.body.code).toBe(0);
    return result.body.data.success[0] as { id: string; ownerId: string; createdByAdminId: string };
  }

  it('自动归属当前管理员，代建时创建者与所有者独立', async () => {
    expect(await folder()).toMatchObject({ ownerId, createdByAdminId: ownerId });
    const delegated = await folder('代建', { ownerId }, rootToken);
    expect(delegated).toMatchObject({ ownerId, createdByAdminId: rootId });
    expect(delegated).not.toHaveProperty('deletedAt');
    const uploaded = await image();
    expect(uploaded).toMatchObject({ ownerId, createdByAdminId: ownerId });
  });
  it('认证、动作权限和跨所有者隔离独立生效', async () => {
    expect((await api().get('/api/asset/folders')).body.code).toBe(40100);
    const other = await folder('他人', {}, rootToken);
    expect(
      (await api().post('/api/asset/folders/update').set('Authorization', auth()).send({ id: other.id, name: '越权' }))
        .body.code
    ).toBe(40300);
    permissions.delete(PermissionCode.ASSET_FOLDER_CREATE);
    expect(
      (await api().post('/api/asset/folders').set('Authorization', auth()).send({ name: '无权限' })).body.code
    ).toBe(40300);
    expect((await api().get(`/api/asset/folders?ownerId=${rootId}`).set('Authorization', auth())).body.code).toBe(
      40300
    );
  });
  it('read-all 单独授权可访问 all，但不隐式获得普通 read', async () => {
    await folder('本人');
    await folder('他人', {}, rootToken);
    permissions = new Set([PermissionCode.ASSET_FOLDER_READ_ALL, PermissionCode.ASSET_IMAGE_READ_ALL]);
    const all = await api().get('/api/asset/folders/all').set('Authorization', auth());
    expect(all.body.code).toBe(0);
    expect(all.body.data.total).toBe(2);
    expect((await api().get('/api/asset/folders').set('Authorization', auth())).body.code).toBe(40300);
    expect((await api().get('/api/asset/images/all').set('Authorization', auth())).body.code).toBe(0);
    expect((await api().get('/api/asset/images').set('Authorization', auth())).body.code).toBe(40300);
    permissions.clear();
    expect((await api().get(`/api/asset/folders/all?ownerId=${ownerId}`).set('Authorization', auth())).body.code).toBe(
      40300
    );
  });
  it('所有者接口不要求 admin.list，拒绝无素材权限并只公开安全账户字段', async () => {
    await folder();
    permissions.add(PermissionCode.ASSET_FOLDER_READ_ALL);
    const own = await api().get('/api/asset/owners').set('Authorization', auth());
    expect(own.body.code).toBe(0);
    expect(own.body.data.items).toContainEqual({ id: ownerId, username: 'asset-owner', isActive: true });
    for (const item of own.body.data.items) expect(Object.keys(item).sort()).toEqual(['id', 'isActive', 'username']);
    permissions.clear();
    expect((await api().get('/api/asset/owners').set('Authorization', auth())).body.code).toBe(40300);
  });
  it('重命名、移动、未分类查询和删除保留一致契约', async () => {
    const target = await folder();
    const uploaded = await image(target.id);
    const loose = await image();
    const renamed = await api()
      .post('/api/asset/folders/update')
      .set('Authorization', auth())
      .send({ id: target.id, name: '新名称' });
    expect(renamed.body.data.name).toBe('新名称');
    const unclassified = await api().get('/api/asset/images?unclassified=true').set('Authorization', auth());
    expect(unclassified.body.code).toBe(0);
    expect(unclassified.body.data.items.map((item: { id: string }) => item.id)).toEqual([loose.id]);
    const moved = await api()
      .post('/api/asset/images/move')
      .set('Authorization', auth())
      .send({ id: loose.id, folderId: target.id });
    expect(moved.body.data).toMatchObject({ id: loose.id, folderId: target.id, ownerId });
    expect(
      (await api().post('/api/asset/folders/soft-delete').set('Authorization', auth()).send({ id: target.id })).body
        .code
    ).toBe(0);
    const after = await api().get('/api/asset/images?unclassified=true').set('Authorization', auth());
    expect(after.body.data.items).toHaveLength(2);
    expect(
      (await api().post('/api/asset/images/soft-delete').set('Authorization', auth()).send({ id: uploaded.id })).body
        .code
    ).toBe(0);
    expect(
      (await api().post('/api/asset/images/soft-delete').set('Authorization', auth()).send({ id: uploaded.id })).body
        .code
    ).toBe(40400);
  });
  it.each([
    '/api/asset/folders?ownerId=0',
    '/api/asset/images?folderId=-1',
    '/api/asset/images?unclassified=1',
    '/api/asset/images?unclassified=true&folderId=1'
  ])('拒绝非法查询 %s', async path => {
    const result = await api().get(path).set('Authorization', auth());
    expect(result.body).toMatchObject({ code: 40001, data: null });
  });
  it('路径 id 和 multipart body 必须通过 DTO，不能注入创建者', async () => {
    expect(
      (await api().post('/api/asset/images/soft-delete').send({ id: 'abc' }).set('Authorization', auth())).body.code
    ).toBe(40001);
    for (const [field, value] of [
      ['createdByAdminId', rootId],
      ['ownerId', '0'],
      ['files', 'forged']
    ]) {
      const result = await api()
        .post('/api/asset/images/batch')
        .set('Authorization', auth())
        .field(field, value)
        .attach('files', png, 'image.png');
      expect(result.body.code).toBe(40001);
    }
    expect(upload).not.toHaveBeenCalled();
  });
  it('读取动态配置限制文件数量和体积，在服务上传前拒绝', async () => {
    const config = app.get(ConfigService);
    const original = config.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
    config.set(CONFIG_KEYS.image, { ...original, maxFiles: 1, maxFileSize: png.length - 1 });
    const large = await api()
      .post('/api/asset/images/batch')
      .set('Authorization', auth())
      .attach('files', png, 'image.png');
    expect(large.body.code).not.toBe(0);
    config.set(CONFIG_KEYS.image, { ...original, maxFiles: 1 });
    const many = await api()
      .post('/api/asset/images/batch')
      .set('Authorization', auth())
      .attach('files', png, '1.png')
      .attach('files', png, '2.png');
    expect(many.body.code).not.toBe(0);
    config.set(CONFIG_KEYS.image, original);
    expect(upload).not.toHaveBeenCalled();
  });
  it('部分失败保留成功，全部失败返回业务错误及安全明细', async () => {
    upload.mockRejectedValueOnce(new Error('secret database failure'));
    const mixed = await api()
      .post('/api/asset/images/batch')
      .set('Authorization', auth())
      .attach('files', png, 'bad.png')
      .attach('files', png, 'ok.png');
    expect(mixed.body.code).toBe(0);
    expect(mixed.body.data).toMatchObject({ totalCount: 2, successCount: 1 });
    upload.mockRejectedValue(new Error('secret database failure'));
    const failed = await api()
      .post('/api/asset/images/batch')
      .set('Authorization', auth())
      .attach('files', png, 'bad.png');
    expect(failed.status).toBe(200);
    expect(failed.body).toMatchObject({
      code: 40001,
      data: { success: [], totalCount: 1, successCount: 0, failed: [{ filename: 'bad.png' }] }
    });
    expect(JSON.stringify(failed.body)).not.toContain('secret');
  });
});
