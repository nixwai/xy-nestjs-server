import { BadRequestException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetController } from '#/modules/asset/asset.controller.js';
import type { AssetFolderService } from '#/modules/asset/asset-folder.service.js';
import type { AssetImageService } from '#/modules/asset/asset-image.service.js';
import type { AssetService } from '#/modules/asset/asset.service.js';
import { AssetUploadInterceptor } from '#/modules/asset/interceptors/asset-upload.interceptor.js';
import { AssetImageQueryDto } from '#/modules/asset/dto/index.js';
import type { AssetFolderRecord, AssetImageRecord } from '#/modules/asset/types/asset.types.js';
import type { AdminJwtPayload } from '#/modules/auth/types/jwt.types.js';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import {
  toAssetFolderResponse,
  toAssetImageResponse,
  toAssetImagePage,
  toAssetUploadResponse,
  toAssetOwnersResponse
} from '#/modules/asset/mappers/asset-response.mapper.js';

const multipart = vi.hoisted(() => ({ factory: vi.fn(), intercept: vi.fn() }));
vi.mock('@nestjs/platform-express', () => ({ FilesInterceptor: multipart.factory }));

const now = new Date('2026-11-10T00:00:00Z');
const folder: AssetFolderRecord & { secret: string } = {
  id: '1',
  name: '照片',
  parentId: null,
  ownerId: '2',
  createdByAdminId: '3',
  imageCount: 1,
  createdAt: now,
  updatedAt: now,
  secret: 'private'
};
const image: AssetImageRecord & { secret: string } = {
  id: '10',
  folderId: '1',
  ownerId: '2',
  createdByAdminId: '3',
  originalName: 'a.png',
  url: 'https://example.invalid/a.png',
  storageKey: 'a.png',
  mimeType: 'image/png',
  size: 10,
  width: 1,
  height: 1,
  createdAt: now,
  updatedAt: now,
  secret: 'private'
};
const page = {
  items: [image],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  secret: 'private'
};
const batch = {
  success: [image],
  failed: [{ filename: 'b.png', reason: '上传失败', secret: 'private' }],
  totalCount: 2,
  successCount: 1,
  secret: 'private'
};
const owners = {
  items: [{ id: '2', username: 'owner', isActive: true, passwordHash: 'private' }],
  total: 1,
  secret: 'private'
};

/** 验证 mapper 不依赖展开运算符公开未来新增的内部字段。 */
describe('素材响应白名单', () => {
  it('文件夹和图片保持所有者与创建者独立且丢弃内部字段', () => {
    const folderResult = toAssetFolderResponse(folder);
    const imageResult = toAssetImageResponse(image);
    expect(folderResult).toEqual({
      id: '1',
      name: '照片',
      parentId: null,
      ownerId: '2',
      createdByAdminId: '3',
      imageCount: 1,
      createdAt: now,
      updatedAt: now
    });
    expect(imageResult).toMatchObject({ id: '10', ownerId: '2', createdByAdminId: '3' });
    expect(imageResult).not.toHaveProperty('secret');
    expect(folder).toHaveProperty('secret', 'private');
    expect(image).toHaveProperty('secret', 'private');
  });
  it('分页、批次和账户列表逐层映射安全字段', () => {
    expect(toAssetImagePage(page)).toEqual({
      items: [toAssetImageResponse(image)],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
    expect(toAssetUploadResponse(batch)).toEqual({
      success: [toAssetImageResponse(image)],
      failed: [{ filename: 'b.png', reason: '上传失败' }],
      totalCount: 2,
      successCount: 1
    });
    expect(toAssetOwnersResponse(owners)).toEqual({
      items: [{ id: '2', username: 'owner', isActive: true }],
      total: 1
    });
  });
});

describe('素材 controller 编排', () => {
  const admin: AdminJwtPayload = { sub: '3', role: 'admin', type: 'access', iat: 0, exp: 9999999999 };
  const service = { listOwners: vi.fn() };
  const folders = { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const images = { list: vi.fn(), upload: vi.fn(), move: vi.fn(), delete: vi.fn() };
  let controller: AssetController;
  beforeEach(() => {
    vi.clearAllMocks();
    service.listOwners.mockResolvedValue(owners);
    folders.list.mockResolvedValue([folder]);
    folders.create.mockResolvedValue(folder);
    folders.update.mockResolvedValue(folder);
    folders.delete.mockResolvedValue(undefined);
    images.list.mockResolvedValue(page);
    images.upload.mockResolvedValue(batch);
    images.move.mockResolvedValue(image);
    images.delete.mockResolvedValue(undefined);
    controller = new AssetController(
      service as unknown as AssetService,
      folders as unknown as AssetFolderService,
      images as unknown as AssetImageService,
      new ConfigService()
    );
  });
  it('所有者、本人目录和全量目录参数互不混用', async () => {
    expect(await controller.listOwners(admin)).toEqual(toAssetOwnersResponse(owners));
    expect(service.listOwners).toHaveBeenCalledWith('3');
    expect(await controller.listFolders(admin, {})).toEqual({ items: [toAssetFolderResponse(folder)], total: 1 });
    expect(folders.list).toHaveBeenLastCalledWith('3', undefined);
    await controller.listAllFolders(admin, { ownerId: '2' });
    expect(folders.list).toHaveBeenLastCalledWith('3', '2', true);
  });
  it('目录写操作传递显式 owner 与 path id 并映射响应', async () => {
    const create = { name: '照片', ownerId: '2' };
    expect(await controller.createFolder(admin, create)).toEqual(toAssetFolderResponse(folder));
    expect(folders.create).toHaveBeenCalledWith('3', create);
    expect(await controller.updateFolder(admin, { id: '1' }, create)).toEqual(toAssetFolderResponse(folder));
    expect(folders.update).toHaveBeenCalledWith('3', '1', create);
    expect(await controller.deleteFolder(admin, { id: '1' }, { ownerId: '2' })).toBeUndefined();
    expect(folders.delete).toHaveBeenCalledWith('3', '1', '2');
  });
  it('图片本人和全量查询保留 DTO', async () => {
    const query = Object.assign(new AssetImageQueryDto(), { ownerId: '2', unclassified: true });
    expect(await controller.listImages(admin, query)).toEqual(toAssetImagePage(page));
    expect(images.list).toHaveBeenLastCalledWith('3', query);
    expect(await controller.listAllImages(admin, query)).toEqual(toAssetImagePage(page));
    expect(images.list).toHaveBeenLastCalledWith('3', query, true);
  });
  it('上传使用真实 body DTO；移动和删除传递资源 ID', async () => {
    const files = [
      {
        fieldname: 'files',
        encoding: '7bit',
        originalname: 'a.png',
        mimetype: 'image/png',
        size: 1,
        buffer: Buffer.from('a')
      }
    ];
    expect(await controller.upload(admin, { ownerId: '2', folderId: '1' }, files)).toEqual(
      toAssetUploadResponse(batch)
    );
    expect(images.upload).toHaveBeenCalledWith('3', files, '1', '2');
    expect(await controller.moveImage(admin, { id: '10' }, { folderId: null, ownerId: '2' })).toEqual(
      toAssetImageResponse(image)
    );
    expect(images.move).toHaveBeenCalledWith('3', '10', null, '2');
    expect(await controller.deleteImage(admin, { id: '10' }, { ownerId: '2' })).toBeUndefined();
    expect(images.delete).toHaveBeenCalledWith('3', '10', '2');
  });
  it.each([undefined, []])('没有文件不得调用上传服务', files => {
    expect(() => controller.upload(admin, {}, files)).toThrow(BadRequestException);
    expect(images.upload).not.toHaveBeenCalled();
  });
  it('服务错误保持向全局过滤器传播', async () => {
    const error = new BadRequestException('业务校验失败');
    service.listOwners.mockRejectedValueOnce(error);
    await expect(controller.listOwners(admin)).rejects.toBe(error);
  });
});

describe('素材动态上传内存边界', () => {
  const context = {} as ExecutionContext;
  const next: CallHandler = { handle: () => of('ok') };
  beforeEach(() => {
    vi.clearAllMocks();
    multipart.intercept.mockResolvedValue(of('ok'));
    multipart.factory.mockReturnValue(
      class {
        intercept = multipart.intercept;
      }
    );
  });
  it.each([
    [1, 1024, 1, 1024],
    [50, 50 * 1024 * 1024, 50, 50 * 1024 * 1024],
    [50, 1024, 50, 1024]
  ])('配置 %i files / %i bytes 保持单文件与数量配置语义', async (maxFiles, maxFileSize, files, fileSize) => {
    const config = new ConfigService({ [CONFIG_KEYS.image]: { maxFiles, maxFileSize } });
    await new AssetUploadInterceptor(config).intercept(context, next);
    expect(multipart.factory).toHaveBeenCalledWith(
      'files',
      files,
      expect.objectContaining({ limits: { files, fileSize, fields: 2, fieldSize: 128, parts: files + 2 } })
    );
    expect(multipart.intercept).toHaveBeenCalledWith(context, next);
  });
  it.each([
    [0, 1],
    [1, 0],
    [1.5, 1],
    [1, 1.5],
    [1, Number.NaN],
    [Number.NaN, 1]
  ])('拒绝非法配置 %s / %s', async (maxFiles, maxFileSize) => {
    const config = new ConfigService({ [CONFIG_KEYS.image]: { maxFiles, maxFileSize } });
    await expect(new AssetUploadInterceptor(config).intercept(context, next)).rejects.toThrow('图片上传配置无效');
    expect(multipart.factory).not.toHaveBeenCalled();
  });
  it('同一实例逐次读取当前配置，不缓存启动时限制', async () => {
    const config = new ConfigService({ [CONFIG_KEYS.image]: { maxFiles: 1, maxFileSize: 100 } });
    const interceptor = new AssetUploadInterceptor(config);
    await interceptor.intercept(context, next);
    config.set(CONFIG_KEYS.image, { maxFiles: 2, maxFileSize: 200 });
    await interceptor.intercept(context, next);
    expect(multipart.factory).toHaveBeenLastCalledWith(
      'files',
      2,
      expect.objectContaining({ limits: expect.objectContaining({ files: 2, fileSize: 200 }) })
    );
  });
});

describe('素材拦截器清理路径', () => {
  it('下游完成与 multipart 失败均保留正常的流和异常行为', async () => {
    const config = new ConfigService({ [CONFIG_KEYS.image]: { maxFiles: 1, maxFileSize: 100 } });
    const interceptor = new AssetUploadInterceptor(config);
    multipart.intercept.mockResolvedValueOnce(of('done'));
    expect(
      await firstValueFrom(await interceptor.intercept({} as ExecutionContext, { handle: () => of('done') }))
    ).toBe('done');
    const error = new BadRequestException('上传失败');
    multipart.intercept.mockRejectedValueOnce(error);
    await expect(interceptor.intercept({} as ExecutionContext, { handle: () => of('done') })).rejects.toBe(error);
  });
});

describe('素材上传限制契约', () => {
  it('公开实际配置而非前端硬编码默认值', () => {
    const controller = new AssetController(
      {} as never,
      {} as never,
      {} as never,
      new ConfigService({ [CONFIG_KEYS.image]: { maxFiles: 7, maxFileSize: 123456 } })
    );
    expect(controller.uploadLimits()).toEqual({ maxFiles: 7, maxFileSize: 123456, maxBatchSize: 64 * 1024 * 1024 });
  });
});
