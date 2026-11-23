import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AssetFolderService } from '#/modules/asset/asset-folder.service.js';
import type { AssetFolderRepository } from '#/modules/asset/repositories/asset-repository.port.js';
import type { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import type { AdminService } from '#/modules/admin/admin.service.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';

const accounts = new Map([
  ['1', { id: '1', username: 'owner' }],
  ['2', { id: '2', username: 'other' }]
]);
const folder = {
  id: 'folder-1',
  name: '目录',
  parentId: null,
  ownerId: '1',
  creatorId: '1',
  createdAt: new Date(),
  updatedAt: new Date()
};

function createService(options: { repository?: Partial<AssetFolderRepository>; permissions?: string[] } = {}) {
  const repository: Partial<AssetFolderRepository> = {
    list: vi.fn().mockResolvedValue([folder]),
    findById: vi.fn().mockResolvedValue(folder),
    findByName: vi.fn().mockResolvedValue(null),
    listChildren: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(folder),
    update: vi.fn().mockResolvedValue(folder),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...options.repository
  };
  const authorization: Partial<AuthorizationService> = {
    hasPermission: vi.fn(async (_id: string, code: string) => options.permissions?.includes(code) ?? false)
  };
  const admins: Partial<AdminService> = {
    findById: vi.fn(async id =>
      accounts.get(id)
        ? ({
            id,
            username: accounts.get(id)!.username,
            isActive: true,
            isRoot: false,
            passwordHash: 'hash',
            passwordSalt: 'salt',
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          } as never)
        : null
    ) as unknown as AdminService['findById']
  };
  return {
    service: new AssetFolderService(
      repository as AssetFolderRepository,
      authorization as AuthorizationService,
      admins as AdminService
    ),
    repository,
    authorization
  };
}

describe('素材文件夹领域规则', () => {
  it('创建时归一化名称并默认归属操作者', async () => {
    const { service, repository } = createService({ permissions: [PermissionCode.ASSET_FOLDER_CREATE] });

    await expect(service.create('1', { name: '  新目录  ' })).resolves.toMatchObject({ name: '目录' });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '新目录', ownerId: '1', creatorId: '1' })
    );
  });

  it('跨账号创建或查询全部需要全局权限，父级归属不一致时拒绝', async () => {
    const withoutGlobal = createService({ permissions: [PermissionCode.ASSET_FOLDER_CREATE] });
    await expect(withoutGlobal.service.create('1', { name: '代建', ownerId: '2' })).rejects.toBeInstanceOf(
      ForbiddenException
    );

    const withGlobal = createService({
      permissions: [PermissionCode.ASSET_FOLDER_CREATE, PermissionCode.ASSET_FOLDER_ALL]
    });
    await expect(withGlobal.service.create('1', { name: '代建', ownerId: '2' })).resolves.toBeDefined();
    await expect(withGlobal.service.getTree('1', true)).resolves.toMatchObject({ owners: expect.any(Array) });
  });

  it('拒绝空名称、同级重名、缺失资源和非空目录删除', async () => {
    const duplicate = createService({
      permissions: [PermissionCode.ASSET_FOLDER_CREATE],
      repository: { findByName: vi.fn().mockResolvedValue(folder) }
    });
    await expect(duplicate.service.create('1', { name: '目录' })).rejects.toBeInstanceOf(ConflictException);

    const invalid = createService({ permissions: [PermissionCode.ASSET_FOLDER_CREATE] });
    await expect(invalid.service.create('1', { name: '   ' })).rejects.toBeInstanceOf(BadRequestException);

    const missing = createService({
      permissions: [PermissionCode.ASSET_FOLDER_UPDATE],
      repository: { findById: vi.fn().mockResolvedValue(null) }
    });
    await expect(missing.service.update('1', 'missing', { name: '新名称' })).rejects.toBeInstanceOf(NotFoundException);

    const nonEmpty = createService({
      permissions: [PermissionCode.ASSET_FOLDER_DELETE],
      repository: { listChildren: vi.fn().mockResolvedValue([folder]) }
    });
    await expect(nonEmpty.service.softDelete('1', 'folder-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('无权限读取全部树和修改他人文件夹时拒绝', async () => {
    const { service } = createService({ permissions: [PermissionCode.ASSET_FOLDER_READ] });

    await expect(service.getTree('1', true)).rejects.toBeInstanceOf(ForbiddenException);
    const otherOwnerFolder = { ...folder, ownerId: '2' };
    const otherOwnerService = createService({
      permissions: [PermissionCode.ASSET_FOLDER_READ],
      repository: { findById: vi.fn().mockResolvedValue(otherOwnerFolder) }
    });
    await expect(otherOwnerService.service.update('1', 'folder-1', { name: '越权' })).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });
});
