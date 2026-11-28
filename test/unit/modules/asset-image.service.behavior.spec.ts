import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AssetImageBatchUploadException, AssetImageService } from '#/modules/asset/asset-image.service.js';
import { AssetImageSearchQueryDto } from '#/modules/asset/dto/index.js';
import { InMemoryAssetFolderRepository } from '#/modules/asset/repositories/in-memory-asset.repository.js';
import type { AssetFolderRepository } from '#/modules/asset/repositories/asset-repository.port.js';
import type { AssetImageRepository } from '#/modules/asset/repositories/asset-image-repository.port.js';
import type { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { UploadService } from '#/modules/upload/upload.service.js';
import type { UploadImageFile } from '#/modules/upload/types/upload-image-file.type.js';
import type { UploadImageResult } from '#/modules/upload/types/upload-result.type.js';

const image = {
  id: 'image-1',
  folderId: '10',
  ownerId: '1',
  creatorId: '1',
  originalName: 'banner.png',
  storageKey: 'assets/1/10/banner.webp',
  mimeType: 'image/webp',
  size: 128,
  width: 320,
  height: 180,
  createdAt: new Date(),
  updatedAt: new Date()
};

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
    findById: vi.fn().mockResolvedValue(image),
    findByName: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({ ...image, originalName: 'renamed.png' }),
    softDelete: vi.fn().mockResolvedValue(undefined),
    move: vi.fn().mockResolvedValue({ ...image, folderId: '11' }),
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
  it('重命名时保留原扩展名并拒绝同目录重名', async () => {
    const { service, images } = createService({ permissions: [PermissionCode.ASSET_FOLDER_READ] });
    await service.update('1', 'image-1', '  renamed.jpg  ');
    expect(images.update).toHaveBeenCalledWith('image-1', { originalName: 'renamed.png' });

    images.findByName = vi.fn().mockResolvedValue(image);
    await expect(service.update('1', 'image-1', 'banner')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('软删除图片需要读取权限并委托仓储', async () => {
    const { service, images } = createService({ permissions: [PermissionCode.ASSET_FOLDER_READ] });
    await service.softDelete('1', 'image-1');
    expect(images.softDelete).toHaveBeenCalledWith('image-1');
  });

  it('移动图片时校验目标文件夹并拒绝原位置', async () => {
    const { images } = createService({ permissions: [PermissionCode.ASSET_FOLDER_READ] });
    const targetFolder = { ...folder, id: '11' };
    const folders = {
      findById: vi
        .fn()
        .mockResolvedValueOnce(targetFolder)
        .mockResolvedValueOnce({ ...folder, id: '10' })
    } as unknown as AssetFolderRepository;
    const custom = new AssetImageService(
      images as AssetImageRepository,
      folders,
      { hasPermission: vi.fn().mockResolvedValue(true) } as unknown as AuthorizationService,
      {} as UploadService
    );
    await custom.move('1', 'image-1', '11');
    expect(images.move).toHaveBeenCalledWith('image-1', '11', '1');
    await expect(custom.move('1', 'image-1', '10')).rejects.toBeInstanceOf(BadRequestException);
  });

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

describe('素材图片搜索数据范围', () => {
  /** 使用真实内存文件夹仓储构造服务，图片仓储替身用于断言解析出的搜索范围。 */
  async function createSearchService(permissions: string[]) {
    const folders = new InMemoryAssetFolderRepository();
    const root = await folders.create({ name: '搜索根目录', parentId: null, ownerId: '1', creatorId: '1' });
    const child = await folders.create({ name: '一级子目录', parentId: root.id, ownerId: '1', creatorId: '1' });
    const grandChild = await folders.create({ name: '二级子目录', parentId: child.id, ownerId: '1', creatorId: '1' });
    const sibling = await folders.create({ name: '同级目录', parentId: null, ownerId: '1', creatorId: '1' });
    const other = await folders.create({ name: '他人目录', parentId: null, ownerId: '2', creatorId: '2' });
    const search = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 6,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    });
    const images: Partial<AssetImageRepository> = { search };
    const authorization: Partial<AuthorizationService> = {
      hasPermission: vi.fn(async (_adminId: string, code: string) => permissions.includes(code))
    };
    const service = new AssetImageService(
      images as AssetImageRepository,
      folders as AssetFolderRepository,
      authorization as AuthorizationService,
      {} as UploadService
    );
    return { service, search, folders, root, child, grandChild, sibling, other };
  }

  /** 组装带默认分页的搜索请求。 */
  function searchQuery(overrides: Partial<AssetImageSearchQueryDto>): AssetImageSearchQueryDto {
    return Object.assign(new AssetImageSearchQueryDto(), { keyword: 'logo', page: 1, pageSize: 6 }, overrides);
  }

  it('选中文件夹时递归命中该文件夹及其全部子孙', async () => {
    const { service, search, root, child, grandChild, sibling, other } = await createSearchService([
      PermissionCode.ASSET_FOLDER_READ
    ]);

    await service.search('1', searchQuery({ folderId: root.id }));

    const [payload] = search.mock.calls[0];
    expect(new Set(payload.folderIds)).toEqual(new Set([root.id, child.id, grandChild.id]));
    expect(payload.folderIds).not.toContain(sibling.id);
    expect(payload.folderIds).not.toContain(other.id);
  });

  it('选中账号根节点时命中该账号全部文件夹', async () => {
    const { service, search, root, child, grandChild, sibling, other } = await createSearchService([
      PermissionCode.ASSET_FOLDER_READ
    ]);

    await service.search('1', searchQuery({ ownerId: '1' }));

    const [payload] = search.mock.calls[0];
    expect(new Set(payload.folderIds)).toEqual(new Set([root.id, child.id, grandChild.id, sibling.id]));
    expect(payload.folderIds).not.toContain(other.id);
  });

  it('未选范围的个人搜索只覆盖当前账号文件夹', async () => {
    const { service, search, folders, other } = await createSearchService([PermissionCode.ASSET_FOLDER_READ]);
    const list = vi.spyOn(folders, 'list');

    await service.search('1', searchQuery({ all: false }));

    expect(list).toHaveBeenCalledWith({ kind: 'owner', ownerId: '1' });
    expect(search.mock.calls[0][0].folderIds).not.toContain(other.id);
  });

  it('全部范围搜索需要全局权限并覆盖所有账号文件夹', async () => {
    const { service, search, folders, other } = await createSearchService([
      PermissionCode.ASSET_FOLDER_READ,
      PermissionCode.ASSET_FOLDER_ALL
    ]);
    const list = vi.spyOn(folders, 'list');

    await service.search('1', searchQuery({ all: true }));

    expect(list).toHaveBeenCalledWith({ kind: 'all' });
    expect(search.mock.calls[0][0].folderIds).toContain(other.id);
  });

  it('缺少全局权限时拒绝全部范围、他人文件夹和他人账号', async () => {
    const { service, other } = await createSearchService([PermissionCode.ASSET_FOLDER_READ]);

    await expect(service.search('1', searchQuery({ all: true }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.search('1', searchQuery({ folderId: other.id }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.search('1', searchQuery({ ownerId: '2' }))).rejects.toBeInstanceOf(ForbiddenException);
    expect(other.ownerId).toBe('2');
  });

  it('范围内没有文件夹时不查询图片', async () => {
    const { service, search } = await createSearchService([PermissionCode.ASSET_FOLDER_READ]);

    const result = await service.search('9', searchQuery({}));

    expect(search).not.toHaveBeenCalled();
    expect(result).toMatchObject({ items: [], total: 0, page: 1, pageSize: 6 });
  });

  it('关键词只有空白时按参数无效拒绝', async () => {
    const { service, search } = await createSearchService([PermissionCode.ASSET_FOLDER_READ]);

    await expect(service.search('1', searchQuery({ keyword: '   ' }))).rejects.toBeInstanceOf(BadRequestException);
    expect(search).not.toHaveBeenCalled();
  });

  it('关键词首尾空白在入库查询前被去除', async () => {
    const { service, search, root } = await createSearchService([PermissionCode.ASSET_FOLDER_READ]);

    await service.search('1', searchQuery({ keyword: ' logo ', folderId: root.id }));

    expect(search.mock.calls[0][0].keyword).toBe('logo');
  });
});
