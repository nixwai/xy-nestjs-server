import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AssetImageBatchUploadException, AssetImageService } from '#/modules/asset/asset-image.service.js';
import type { AssetFolderRepository } from '#/modules/asset/repositories/asset-repository.port.js';
import type { AssetImageRepository } from '#/modules/asset/repositories/asset-image-repository.port.js';
import type { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { UploadService } from '#/modules/upload/upload.service.js';
import type { UploadImageFile } from '#/modules/upload/types/upload-image-file.type.js';
import type { UploadImageResult } from '#/modules/upload/types/upload-result.type.js';

const folder = {
  id: '10',
  name: '素材',
  parentId: null,
  ownerId: '1',
  creatorId: '1',
  createdAt: new Date(),
  updatedAt: new Date()
};

const uploaded: UploadImageResult = {
  storageKey: 'assets/1/10/image.webp',
  category: 'asset',
  mimeType: 'image/webp',
  size: 128,
  width: 320,
  height: 180
};

function createFile(name: string): UploadImageFile {
  const buffer = Buffer.from('image');
  return {
    fieldname: 'files',
    originalname: name,
    encoding: '7bit',
    mimetype: 'image/png',
    size: buffer.length,
    buffer
  };
}

function createService(
  options: {
    permissions?: string[];
    folder?: typeof folder | null;
    imageRepository?: Partial<AssetImageRepository>;
    uploadService?: Partial<UploadService>;
  } = {}
) {
  const folders: Partial<AssetFolderRepository> = {
    findById: vi.fn().mockResolvedValue(options.folder === undefined ? folder : options.folder)
  };
  const images: Partial<AssetImageRepository> = {
    list: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    }),
    create: vi.fn().mockResolvedValue({ id: '1', folderId: folder.id, originalName: 'one.png' }),
    ...options.imageRepository
  };
  const authorization: Partial<AuthorizationService> = {
    hasPermission: vi.fn(async (_adminId: string, code: string) => options.permissions?.includes(code) ?? false)
  };
  const uploadService: Partial<UploadService> = {
    uploadImage: vi.fn().mockResolvedValue(uploaded),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    ...options.uploadService
  };
  return {
    service: new AssetImageService(
      images as AssetImageRepository,
      folders as AssetFolderRepository,
      authorization as AuthorizationService,
      uploadService as UploadService
    ),
    images,
    uploadService
  };
}

describe('素材图片领域规则', () => {
  it('只按当前文件夹 ID 查询直属图片，不递归读取子文件夹', async () => {
    const { service, images } = createService({ permissions: [PermissionCode.ASSET_FOLDER_READ] });
    await service.list('1', { folderId: '10', page: 2, pageSize: 10, skip: 10 });
    expect(images.list).toHaveBeenCalledWith({ folderId: '10', page: 2, pageSize: 10, skip: 10 });
  });

  it('本人文件夹上传成功后保存图片元数据并使用稳定文件夹 Key', async () => {
    const { service, images, uploadService } = createService({ permissions: [PermissionCode.ASSET_FOLDER_READ] });
    await service.upload('1', '10', [createFile('one.png')]);
    expect(uploadService.uploadImage).toHaveBeenCalledWith(expect.anything(), 'asset', 'assets/1/10');
    expect(images.create).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: '10', ownerId: '1', creatorId: '1', originalName: 'one.png' })
    );
  });

  it('批量上传允许部分成功并返回失败文件明细', async () => {
    const uploadImage = vi
      .fn()
      .mockResolvedValueOnce(uploaded)
      .mockRejectedValueOnce(new BadRequestException('仅支持 JPEG、PNG、WebP、GIF 格式的图片'));
    const { service } = createService({
      permissions: [PermissionCode.ASSET_FOLDER_READ],
      uploadService: { uploadImage }
    });
    const result = await service.upload('1', '10', [createFile('ok.png'), createFile('bad.txt')]);
    expect(result).toMatchObject({ totalCount: 2, successCount: 1, failed: [{ filename: 'bad.txt' }] });
  });

  it('批量全部失败时返回脱敏后的公开业务异常', async () => {
    const { service } = createService({
      permissions: [PermissionCode.ASSET_FOLDER_READ],
      uploadService: {
        uploadImage: vi.fn().mockRejectedValue(new BadRequestException('仅支持 JPEG、PNG、WebP、GIF 格式的图片'))
      }
    });
    await expect(service.upload('1', '10', [createFile('secret.png')])).rejects.toSatisfy(error => {
      return (
        error instanceof AssetImageBatchUploadException &&
        error.data.failed[0].reason === '仅支持 JPEG、PNG、WebP、GIF 格式的图片'
      );
    });
  });

  it('无全局权限时拒绝访问其他账号文件夹', async () => {
    const { service } = createService({
      permissions: [PermissionCode.ASSET_FOLDER_READ],
      folder: { ...folder, ownerId: '2' }
    });
    await expect(service.list('1', { folderId: '10', page: 1, pageSize: 20, skip: 0 })).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('元数据入库失败时删除已上传对象', async () => {
    const create = vi.fn().mockRejectedValue(new Error('persist failed'));
    const deleteObject = vi.fn().mockResolvedValue(undefined);
    const { service } = createService({
      permissions: [PermissionCode.ASSET_FOLDER_READ],
      imageRepository: { create },
      uploadService: { deleteObject }
    });
    await expect(service.upload('1', '10', [createFile('one.png')])).rejects.toBeInstanceOf(
      InternalServerErrorException
    );
    expect(deleteObject).toHaveBeenCalledWith(uploaded.storageKey);
  });
});
