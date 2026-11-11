import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssetFolderService } from '#/modules/asset/asset-folder.service.js';

const folder = (extra = {}) => ({
  id: '10',
  name: 'A',
  parentId: null,
  ownerId: '2',
  createdByAdminId: '1',
  imageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...extra
});
function setup() {
  const folders = {
    lockOwner: vi.fn(),
    findById: vi.fn(async () => folder()),
    findByName: vi.fn(async () => null),
    create: vi.fn(async x => folder(x)),
    update: vi.fn(async (_id, x) => folder(x)),
    list: vi.fn(async () => [folder()]),
    listDescendants: vi.fn(async () => [folder(), folder({ id: '11', parentId: '10' })]),
    softDeleteMany: vi.fn()
  };
  const images = { moveFoldersToRoot: vi.fn() };
  const transactions = { run: vi.fn(async work => work({ folders, images })) };
  const policy = {
    queryScope: vi.fn(async () => ({ kind: 'owner', ownerId: '2' })),
    assertManage: vi.fn(),
    assertOwnerExists: vi.fn()
  };
  return {
    service: new AssetFolderService(folders as never, transactions as never, policy as never),
    folders,
    images,
    policy
  };
}
describe('AssetFolderService', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('stores actor separately from requested owner', async () => {
    const { service, folders, policy } = setup();
    const result = await service.create('1', { name: ' B ', ownerId: '2' });
    expect(result).toMatchObject({ name: 'B', ownerId: '2', createdByAdminId: '1' });
    expect(policy.assertOwnerExists).toHaveBeenCalledWith('2', true);
    expect(folders.lockOwner).toHaveBeenCalledWith('2', true);
  });
  it('rejects a parent owned by another user even for full permissions', async () => {
    const { service, folders } = setup();
    folders.findById.mockResolvedValue(folder({ ownerId: '3' }));
    await expect(service.create('1', { name: 'B', ownerId: '2', parentId: '10' })).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(folders.create).not.toHaveBeenCalled();
  });
  it('rejects missing parent, blank names and active duplicates', async () => {
    const a = setup();
    a.folders.findById.mockResolvedValue(null as never);
    await expect(a.service.create('1', { name: 'B', ownerId: '2', parentId: '10' })).rejects.toBeInstanceOf(
      NotFoundException
    );
    await expect(a.service.create('1', { name: ' ', ownerId: '2' })).rejects.toBeInstanceOf(BadRequestException);
    const b = setup();
    b.folders.findByName.mockResolvedValue(folder() as never);
    await expect(b.service.create('1', { name: 'B', ownerId: '2' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('renames without changing owner or creator and checks uniqueness', async () => {
    const { service, folders } = setup();
    await service.update('1', '10', { ownerId: '2', name: 'New' });
    expect(folders.update).toHaveBeenCalledWith('10', { name: 'New' });
    expect(folders.findByName).toHaveBeenCalledWith('2', null, 'New', '10');
  });
  it('does not trust a mismatching requested owner', async () => {
    const { service, folders } = setup();
    await expect(service.update('1', '10', { ownerId: '3', name: 'New' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(folders.update).not.toHaveBeenCalled();
  });
  it('recursively unclassifies images and soft-deletes descendants', async () => {
    const { service, folders, images } = setup();
    await service.delete('1', '10', '2');
    expect(images.moveFoldersToRoot).toHaveBeenCalledWith(['10', '11']);
    expect(folders.softDeleteMany).toHaveBeenCalledWith(['10', '11']);
  });
  it('does not delete folders if moving the images fails', async () => {
    const { service, folders, images } = setup();
    images.moveFoldersToRoot.mockRejectedValue(new Error('db'));
    await expect(service.delete('1', '10', '2')).rejects.toThrow('db');
    expect(folders.softDeleteMany).not.toHaveBeenCalled();
  });
  it('passes explicit scope to the repository', async () => {
    const { service, folders, policy } = setup();
    await service.list('1', '2');
    expect(policy.queryScope).toHaveBeenCalledWith('1', 'folder', '2', false);
    expect(folders.list).toHaveBeenCalledWith({ kind: 'owner', ownerId: '2' });
  });
});
