import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetFolderService } from '#/modules/asset/asset-folder.service.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { AssetFolderQueryScope, AssetFolderRecord } from '#/modules/asset/types/index.js';

const account = (id: string, username = `user-${id}`, isActive = true) => ({
  id,
  username,
  isActive,
  isRoot: false,
  roleIds: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

function setup(granted: string[] = Object.values(PermissionCode), adminRecords = [account('1'), account('2')]) {
  const records = new Map<string, AssetFolderRecord>();
  let nextId = 1;
  const repository = {
    list: vi.fn(async (scope: AssetFolderQueryScope) =>
      [...records.values()].filter(item => scope.kind === 'all' || item.ownerId === scope.ownerId)
    ),
    findById: vi.fn(async (id: string) => records.get(id) ?? null),
    findByName: vi.fn(
      async (ownerId: string, parentId: string | null, name: string, excludeId?: string) =>
        [...records.values()].find(
          item => item.id !== excludeId && item.ownerId === ownerId && item.parentId === parentId && item.name === name
        ) ?? null
    ),
    listChildren: vi.fn(async (parentId: string) => [...records.values()].filter(item => item.parentId === parentId)),
    create: vi.fn(async input => {
      const now = new Date();
      const item = { id: String(nextId++), ...input, createdAt: now, updatedAt: now } as AssetFolderRecord;
      records.set(item.id, item);
      return item;
    }),
    update: vi.fn(async (id: string, input) => {
      const current = records.get(id)!;
      const item = { ...current, ...input, updatedAt: new Date() };
      records.set(id, item);
      return item;
    }),
    softDelete: vi.fn(async (id: string) => records.delete(id))
  };
  const admins = {
    findById: vi.fn(async (id: string) => (id === '404' ? null : account(id))),
    listAdmins: vi.fn(async () => ({ items: adminRecords, hasNextPage: false }))
  };
  const authorization = {
    hasPermission: vi.fn(async (_id: string, code: string) => granted.includes(code))
  };
  return {
    service: new AssetFolderService(repository as never, authorization as never, admins as never),
    repository,
    authorization
  };
}

describe('AssetFolderService', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('保存拥有者和创建者，并按父级建立多级树', async () => {
    const { service } = setup();
    const root = await service.create('1', { name: '文件夹A' });
    const child = await service.create('1', { name: '文件夹B', parentId: root.id });
    const grandchild = await service.create('1', { name: '文件夹C', parentId: child.id });

    expect(grandchild).toMatchObject({ ownerId: '1', creatorId: '1', parentId: child.id });
    const tree = await service.getTree('1');
    const ownerTree = tree.owners.find(item => item.owner.id === '1');
    const folderA = ownerTree?.children.find(item => item.name === '文件夹A');
    const folderB = folderA?.children.find(item => item.name === '文件夹B');

    expect(folderB?.children.find(item => item.name === '文件夹C')).toBeDefined();
  });

  it('查看全部时读取全部拥有者的文件夹', async () => {
    const { service } = setup();
    await service.create('1', { name: '自己的目录' });
    await service.create('1', { name: '他人的目录', ownerId: '2' });

    const tree = await service.getTree('1', true);
    const otherOwner = tree.owners.find(item => item.owner.id === '2');

    expect(otherOwner?.children.map(item => item.name)).toEqual(['他人的目录']);
  });

  it('跨拥有者操作需要全局素材管理权限', async () => {
    const { service } = setup([]);
    await expect(service.create('1', { name: '代建', ownerId: '2' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('全局素材管理权限允许为停用拥有者创建文件夹', async () => {
    const { service } = setup(Object.values(PermissionCode), [account('1'), account('2', 'user-2', false)]);

    await expect(service.create('1', { name: '停用账号目录', ownerId: '2' })).resolves.toMatchObject({ ownerId: '2' });
  });

  it('全局素材管理权限允许更新其他拥有者的文件夹', async () => {
    const { service } = setup(Object.values(PermissionCode));
    const folder = await service.create('1', { name: '他人目录', ownerId: '2' });

    await expect(service.update('1', folder.id, { name: '已更新' })).resolves.toMatchObject({
      id: folder.id,
      name: '已更新',
      ownerId: '2'
    });
  });

  it('没有全局素材管理权限不能删除其他拥有者的文件夹', async () => {
    const { service } = setup([]);
    const folder = await service.create('2', { name: '他人目录' });

    await expect(service.softDelete('1', folder.id)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('拒绝同级重名以及删除非空文件夹', async () => {
    const { service } = setup();
    const root = await service.create('1', { name: '重复' });
    await expect(service.create('1', { name: '重复' })).rejects.toBeInstanceOf(ConflictException);
    await service.create('1', { name: '子目录', parentId: root.id });
    await expect(service.softDelete('1', root.id)).rejects.toThrow('请先删除子文件夹');
  });

  it('支持重命名文件夹', async () => {
    const { service } = setup();
    const folder = await service.create('1', { name: '旧名称' });

    await expect(service.update('1', folder.id, { name: '新名称' })).resolves.toMatchObject({
      id: folder.id,
      name: '新名称'
    });
  });

  it('文件夹不存在时按资源缺失处理', async () => {
    const { service } = setup();

    await expect(service.update('1', '999', { name: '新名称' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.softDelete('1', '999')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('创建时父级或归属账号缺失按资源缺失处理', async () => {
    const { service } = setup();

    await expect(service.create('1', { name: '孤儿目录', parentId: '999' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.create('404', { name: '无主目录' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('缺少全局素材管理权限不能读取全部文件夹树', async () => {
    const { service } = setup([PermissionCode.ASSET_FOLDER_READ]);

    await expect(service.getTree('1', true)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('账号不存在时无法作为树根读取', async () => {
    const { service } = setup();

    await expect(service.getTree('404')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('树节点通过 owner 与 creator 承载账号信息', async () => {
    const { service } = setup();
    const folder = await service.create('1', { name: '目录' });

    const tree = await service.getTree('1');
    const node = tree.owners[0]?.children.find(item => item.name === '目录');

    expect(node).toMatchObject({
      id: folder.id,
      owner: { id: '1', username: 'user-1' },
      creator: { id: '1', username: 'user-1' }
    });
    expect(node).not.toHaveProperty('ownerUsername');
  });
});
