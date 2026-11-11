import { describe, expect, it, vi } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import type { DataSource, Repository, QueryRunner } from 'typeorm';
import { AssetFolderEntity } from '#/modules/asset/entities/asset-folder.entity.js';
import { AssetImageEntity } from '#/modules/asset/entities/asset-image.entity.js';
import {
  TypeOrmAssetFolderRepository,
  TypeOrmAssetImageRepository
} from '#/modules/asset/repositories/asset.repository.js';
import { TypeOrmAssetTransactionRunner } from '#/modules/asset/repositories/asset-transaction.runner.js';
import { CreateAssetManagement1794003000000 } from '#/database/migrations/1794003000000-CreateAssetManagement.js';

const row = {
  id: '1',
  parentId: null,
  ownerId: '7',
  createdByAdminId: '9',
  name: 'folder',
  createdAt: new Date(),
  updatedAt: new Date()
};
function builder() {
  const qb = {
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue([]),
    getManyAndCount: vi.fn().mockResolvedValue([[], 0])
  };
  return qb;
}
describe('素材生产仓储与迁移守卫', () => {
  it('findById不发出count，列表只用一次分组计数', async () => {
    const qb = builder();
    qb.getRawMany.mockResolvedValue([{ folderId: '1', imageCount: '3' }]);
    const folders = { findOne: vi.fn().mockResolvedValue(row), find: vi.fn().mockResolvedValue([row]) };
    const images = { count: vi.fn(), createQueryBuilder: vi.fn().mockReturnValue(qb) };
    const repo = new TypeOrmAssetFolderRepository(
      folders as unknown as Repository<AssetFolderEntity>,
      images as unknown as Repository<AssetImageEntity>
    );
    expect(await repo.findById('1')).toMatchObject({ imageCount: 0, ownerId: '7', createdByAdminId: '9' });
    expect(images.count).not.toHaveBeenCalled();
    expect(await repo.list({ kind: 'owner', ownerId: '7' })).toEqual([expect.objectContaining({ imageCount: 3 })]);
    expect(folders.find).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: '7' } }));
    expect(qb.groupBy).toHaveBeenCalledWith('image.folderId');
    expect(qb.getRawMany).toHaveBeenCalledTimes(1);
  });
  it('图片查询绑定归属且支持未分类', async () => {
    const qb = builder();
    const images = { createQueryBuilder: vi.fn().mockReturnValue(qb) };
    const repo = new TypeOrmAssetImageRepository(images as unknown as Repository<AssetImageEntity>);
    await repo.list({ scope: { kind: 'owner', ownerId: '7' }, unclassified: true, page: 1, pageSize: 20, skip: 0 });
    expect(qb.andWhere).toHaveBeenCalledWith('image.ownerId = :ownerId', { ownerId: '7' });
    expect(qb.andWhere).toHaveBeenCalledWith('image.folderId IS NULL');
  });
  it('事务通过manager重建repositories，lockOwner锁管理员且失败向外传播', async () => {
    const query = vi.fn().mockResolvedValue([{ id: '7' }]);
    const manager = {
      getRepository: vi.fn().mockReturnValue({ manager: { queryRunner: { isTransactionActive: true }, query } })
    };
    const transaction = vi.fn(async (callback: (value: typeof manager) => Promise<unknown>) => callback(manager));
    const runner = new TypeOrmAssetTransactionRunner({ transaction } as unknown as DataSource);
    await expect(
      runner.run(async ({ folders, images }) => {
        expect(folders).toBeInstanceOf(TypeOrmAssetFolderRepository);
        expect(images).toBeInstanceOf(TypeOrmAssetImageRepository);
        await folders.lockOwner('7');
        throw new Error('rollback');
      })
    ).rejects.toThrow('rollback');
    expect(query).toHaveBeenCalledWith(
      'SELECT `id`, `is_active` FROM `admin` WHERE `id` = ? AND `deleted_at` IS NULL FOR UPDATE',
      ['7']
    );
    expect(manager.getRepository).toHaveBeenCalledWith(AssetFolderEntity);
    expect(manager.getRepository).toHaveBeenCalledWith(AssetImageEntity);
  });
  it('迁移up/down及实体拥有一致的生成列和有效唯一索引', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const runner = { query } as unknown as QueryRunner;
    const migration = new CreateAssetManagement1794003000000();
    await migration.up(runner);
    const sql = query.mock.calls.map(args => String(args[0])).join('\n');
    expect(sql).toContain('IFNULL(`parent_id`,0)');
    expect(sql).toContain('IF(`deleted_at` IS NULL,1,NULL)');
    expect(sql).toContain('(`owner_admin_id`, `parent_scope`, `name`, `active_marker`)');
    expect(sql).not.toContain('FOREIGN KEY');
    expect(sql).not.toContain('REFERENCES');
    const metadata = getMetadataArgsStorage();
    expect(
      metadata.foreignKeys.filter(x => x.target === AssetFolderEntity || x.target === AssetImageEntity)
    ).toHaveLength(0);
    expect(metadata.indices.find(x => x.target === AssetFolderEntity && x.unique)?.columns).toEqual([
      'ownerId',
      'parentScope',
      'name',
      'activeMarker'
    ]);
    await migration.down(runner);
    expect(query.mock.calls.slice(-2).map(args => args[0])).toEqual([
      'DROP TABLE `asset_image`',
      'DROP TABLE `asset_folder`'
    ]);
  });
});

it('生产目录保存竞争重复错误映射及其他错误传播', async () => {
  const input = { name: 'folder', parentId: null, ownerId: '7', createdByAdminId: '9' };
  const raw = { ...input, id: '1', createdAt: new Date(), updatedAt: new Date() };
  const repo = { findOne: vi.fn().mockResolvedValue(null), create: vi.fn((value: unknown) => value), save: vi.fn() };
  const folders = new TypeOrmAssetFolderRepository(
    repo as unknown as Repository<AssetFolderEntity>,
    {} as Repository<AssetImageEntity>
  );
  for (const error of [
    { driverError: { code: 'ER_DUP_ENTRY' } },
    new Error('connection lost'),
    { driverError: null }
  ]) {
    repo.save.mockRejectedValue(error);
    if ('driverError' in error && error.driverError?.code === 'ER_DUP_ENTRY')
      await expect(folders.create(input)).rejects.toMatchObject({ name: 'DomainConflictError' });
    else await expect(folders.create(input)).rejects.toBe(error);
    repo.findOne.mockResolvedValueOnce(raw).mockResolvedValueOnce(null);
    if ('driverError' in error && error.driverError?.code === 'ER_DUP_ENTRY')
      await expect(folders.update('1', { name: 'new' })).rejects.toMatchObject({ name: 'DomainConflictError' });
    else await expect(folders.update('1', { name: 'new' })).rejects.toBe(error);
  }
});

function persistenceMock() {
  const qb = builder();
  const repository = {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockResolvedValue([]),
    create: vi.fn((value: unknown) => value),
    save: vi.fn(async (value: unknown) => value),
    softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: vi.fn().mockReturnValue(qb),
    manager: { queryRunner: { isTransactionActive: true }, query: vi.fn().mockResolvedValue([]) }
  };
  return { qb, repository };
}

it('生产目录仓储成功、空集合、不存在及批量路径', async () => {
  const { repository: raw, qb } = persistenceMock();
  const repo = new TypeOrmAssetFolderRepository(
    raw as unknown as Repository<AssetFolderEntity>,
    raw as unknown as Repository<AssetImageEntity>
  );
  expect(await repo.list({ kind: 'all' })).toEqual([]);
  expect(await repo.findById('missing')).toBeNull();
  expect(await repo.listDescendants('missing')).toEqual([]);
  await expect(repo.update('missing', { name: 'x' })).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  await expect(repo.softDelete('missing')).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  raw.save.mockResolvedValue(row);
  expect(await repo.create({ name: 'folder', parentId: null, ownerId: '7', createdByAdminId: '9' })).toMatchObject({
    id: '1'
  });
  raw.findOne.mockResolvedValueOnce(row).mockResolvedValueOnce(null);
  expect(await repo.update('1', { name: 'renamed' })).toMatchObject({ id: '1' });
  raw.findOne.mockResolvedValueOnce(row);
  await repo.softDelete('1');
  expect(raw.softDelete).toHaveBeenCalled();
  raw.softDelete.mockClear();
  await repo.softDeleteMany([]);
  expect(raw.softDelete).not.toHaveBeenCalled();
  await repo.softDeleteMany(['1', '2']);
  expect(raw.softDelete).toHaveBeenCalledTimes(1);
  qb.getRawMany.mockResolvedValue([{ ownerId: 7 }]);
  expect(await repo.listOwnerIds()).toEqual(['7']);
  raw.findOne.mockResolvedValueOnce(row);
  raw.find.mockResolvedValueOnce([{ ...row, id: '2', parentId: '1' }]).mockResolvedValueOnce([]);
  expect((await repo.listDescendants('1')).map(item => item.id)).toEqual(['1', '2']);
  raw.findOne.mockResolvedValueOnce(row);
  await expect(
    repo.create({ name: 'folder', parentId: null, ownerId: '7', createdByAdminId: '9' })
  ).rejects.toMatchObject({ name: 'DomainConflictError' });
  raw.findOne.mockResolvedValueOnce(row).mockResolvedValueOnce(row);
  await expect(repo.update('1', { name: 'folder' })).rejects.toMatchObject({ name: 'DomainConflictError' });
  await expect(repo.lockOwner('7')).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  raw.manager.queryRunner.isTransactionActive = false;
  await expect(repo.lockOwner('7')).rejects.toThrow('必须在素材事务中调用');
});

it('生产图片仓储成功、缺失、批量及过滤路径', async () => {
  const { repository: raw, qb } = persistenceMock();
  const repo = new TypeOrmAssetImageRepository(raw as unknown as Repository<AssetImageEntity>);
  const input = {
    folderId: null,
    ownerId: '7',
    createdByAdminId: '9',
    storageKey: 'key',
    originalName: 'x.png',
    url: 'https://example.test/x.png',
    mimeType: 'image/png',
    size: 2,
    width: null,
    height: null
  };
  const saved = { ...input, id: '1', createdAt: new Date(), updatedAt: new Date() };
  raw.save.mockResolvedValue(saved);
  expect(await repo.create(input)).toMatchObject(input);
  expect(await repo.findById('missing')).toBeNull();
  raw.findOne.mockResolvedValueOnce(saved);
  expect(await repo.findById('1')).toMatchObject({ id: '1' });
  raw.findOne.mockResolvedValueOnce(saved);
  expect(await repo.updateFolder('1', '2')).toMatchObject({ id: '1' });
  await expect(repo.updateFolder('missing', null)).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  await expect(repo.softDelete('missing')).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  raw.findOne.mockResolvedValueOnce(saved);
  await repo.softDelete('1');
  expect(raw.softDelete).toHaveBeenCalledWith('1');
  await repo.moveFoldersToRoot([]);
  expect(raw.update).not.toHaveBeenCalled();
  await repo.moveToRoot('2');
  expect(raw.update).toHaveBeenCalledWith(expect.any(Object), { folderId: null });
  qb.getRawMany.mockResolvedValue([{ ownerId: 7 }]);
  expect(await repo.listOwnerIds()).toEqual(['7']);
  qb.getManyAndCount.mockResolvedValue([[saved], 1]);
  const result = await repo.list({
    scope: { kind: 'all' },
    folderId: '2',
    keyword: 'x',
    page: 1,
    pageSize: 20,
    skip: 0
  });
  expect(result.total).toBe(1);
  expect(result.items).toEqual([expect.objectContaining(input)]);
  expect(qb.andWhere).toHaveBeenCalledWith('image.folderId = :folderId', { folderId: '2' });
  expect(qb.andWhere).toHaveBeenCalledWith("image.originalName LIKE :keyword ESCAPE '!'", { keyword: '%x%' });
});

it('lockOwner在事务同一连接校验启用状态，不额外获取管理员连接', async () => {
  const { repository: raw } = persistenceMock();
  const repo = new TypeOrmAssetFolderRepository(
    raw as unknown as Repository<AssetFolderEntity>,
    {} as Repository<AssetImageEntity>
  );
  raw.manager.query.mockResolvedValue([{ id: '7', is_active: 0 }]);
  await expect(repo.lockOwner('7', true)).rejects.toMatchObject({ name: 'ForbiddenException' });
  await expect(repo.lockOwner('7')).resolves.toBeUndefined();
  raw.manager.query.mockResolvedValue([{ id: '7', is_active: 1 }]);
  await expect(repo.lockOwner('7', true)).resolves.toBeUndefined();
});

it('生产图片关键词转义通配符并使用显式ESCAPE', async () => {
  const { repository: raw, qb } = persistenceMock();
  const repo = new TypeOrmAssetImageRepository(raw as unknown as Repository<AssetImageEntity>);
  await repo.list({ scope: { kind: 'all' }, keyword: 'Case%_!\\', page: 1, pageSize: 20, skip: 0 });
  expect(qb.andWhere).toHaveBeenCalledWith("image.originalName LIKE :keyword ESCAPE '!'", {
    keyword: '%Case!%!_!!\\%'
  });
});

it('名称和搜索实体及迁移显式使用NO PAD二进制排序规则', async () => {
  const columns = getMetadataArgsStorage().columns;
  expect(columns.find(x => x.target === AssetFolderEntity && x.propertyName === 'name')?.options.collation).toBe(
    'utf8mb4_0900_bin'
  );
  expect(columns.find(x => x.target === AssetImageEntity && x.propertyName === 'originalName')?.options.collation).toBe(
    'utf8mb4_0900_bin'
  );
  const query = vi.fn().mockResolvedValue([]);
  await new CreateAssetManagement1794003000000().up({ query } as unknown as QueryRunner);
  const sql = query.mock.calls.map(args => String(args[0])).join('\n');
  expect(sql).toContain('`name` varchar(128) COLLATE utf8mb4_0900_bin NOT NULL');
  expect(sql).toContain('`original_name` varchar(255) COLLATE utf8mb4_0900_bin NOT NULL');
});

it('生产图片重复storageKey映射领域冲突，其他数据库错误保持传播', async () => {
  const { repository: raw } = persistenceMock();
  const repo = new TypeOrmAssetImageRepository(raw as unknown as Repository<AssetImageEntity>);
  const input = {
    folderId: null,
    ownerId: '7',
    createdByAdminId: '9',
    storageKey: 'duplicate-key',
    originalName: 'image.png',
    url: 'https://example.test/image.png',
    mimeType: 'image/png',
    size: 1,
    width: null,
    height: null
  };
  raw.save.mockRejectedValue({ driverError: { code: 'ER_DUP_ENTRY' } });
  await expect(repo.create(input)).rejects.toMatchObject({ name: 'DomainConflictError', message: '素材存储键已存在' });
  const failure = new Error('connection lost');
  raw.save.mockRejectedValue(failure);
  await expect(repo.create(input)).rejects.toBe(failure);
});
