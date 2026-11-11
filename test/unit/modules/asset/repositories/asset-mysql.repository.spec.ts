import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AdminEntity } from '#/modules/admin/entities/admin.entity.js';
import { AssetFolderEntity } from '#/modules/asset/entities/asset-folder.entity.js';
import { AssetImageEntity } from '#/modules/asset/entities/asset-image.entity.js';
import {
  TypeOrmAssetFolderRepository,
  TypeOrmAssetImageRepository
} from '#/modules/asset/repositories/asset.repository.js';
import { TypeOrmAssetTransactionRunner } from '#/modules/asset/repositories/asset-transaction.runner.js';
import { CreateAssetManagement1794003000000 } from '#/database/migrations/1794003000000-CreateAssetManagement.js';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';

const port = Number(process.env.ASSET_MYSQL_TEST_PORT);
const enabled = Number.isInteger(port) && port > 1024 && port <= 65535;
const folder = (name: string, parentId: string | null = null, ownerId = '1') => ({
  name,
  parentId,
  ownerId,
  createdByAdminId: '9'
});
const image = (key: string, folderId: string | null, ownerId = '1') => ({
  folderId,
  ownerId,
  createdByAdminId: '9',
  storageKey: key,
  originalName: `${key}.png`,
  url: `https://example.test/${key}`,
  mimeType: 'image/png',
  size: 7,
  width: 1,
  height: null
});

describe.skipIf(!enabled)('独立一次性 MySQL 素材仓储集成（仅 ASSET_MYSQL_TEST_PORT）', () => {
  const dataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port,
    username: 'root',
    password: '',
    database: 'asset_isolated_test',
    entities: [AdminEntity, AssetFolderEntity, AssetImageEntity],
    synchronize: false,
    namingStrategy: new SnakeNamingStrategy(),
    extra: { connectionLimit: 5 }
  });
  let folders: TypeOrmAssetFolderRepository;
  let images: TypeOrmAssetImageRepository;
  let transactions: TypeOrmAssetTransactionRunner;
  beforeAll(async () => {
    await dataSource.initialize();
    // 此库仅存在于临时容器；不加载项目 data-source、环境文件或开发配置。
    await dataSource.query(
      'CREATE TABLE `admin` (`id` bigint UNSIGNED NOT NULL PRIMARY KEY, `is_active` boolean NOT NULL DEFAULT 1, `deleted_at` datetime NULL) ENGINE=InnoDB'
    );
    await dataSource.query('INSERT INTO `admin` (`id`) VALUES (1),(2),(9)');
    const runner = dataSource.createQueryRunner();
    try {
      await new CreateAssetManagement1794003000000().up(runner);
    } finally {
      await runner.release();
    }
    images = new TypeOrmAssetImageRepository(dataSource.getRepository(AssetImageEntity));
    folders = new TypeOrmAssetFolderRepository(
      dataSource.getRepository(AssetFolderEntity),
      dataSource.getRepository(AssetImageEntity)
    );
    transactions = new TypeOrmAssetTransactionRunner(dataSource);
  }, 30000);
  afterAll(async () => {
    if (!dataSource.isInitialized) return;
    try {
      const runner = dataSource.createQueryRunner();
      try {
        if (await runner.hasTable('asset_image')) await runner.query('DROP TABLE `asset_image`');
        if (await runner.hasTable('asset_folder')) await runner.query('DROP TABLE `asset_folder`');
        await runner.query('DROP TABLE `admin`');
      } finally {
        await runner.release();
      }
    } finally {
      await dataSource.destroy();
    }
  });
  it('根及子目录有效名称唯一、owner和creator独立、软删后重建', async () => {
    const root = await transactions.run(async ({ folders: repo }) => {
      await repo.lockOwner('1');
      return repo.create(folder('unique'));
    });
    await expect(folders.create(folder('unique'))).rejects.toBeInstanceOf(DomainConflictError);
    await folders.create(folder('unique', null, '2'));
    const child = await folders.create(folder('child', root.id));
    await expect(folders.create(folder('child', root.id))).rejects.toBeInstanceOf(DomainConflictError);
    await folders.softDelete(child.id);
    expect((await folders.create(folder('child', root.id))).id).not.toBe(child.id);
    await folders.softDelete(root.id);
    expect((await folders.create(folder('unique'))).id).not.toBe(root.id);
    expect(await folders.findById(root.id)).toBeNull();
    await expect(dataSource.query('DELETE FROM `admin` WHERE `id` = 9')).rejects.toThrow();
    await expect(dataSource.query('DELETE FROM `admin` WHERE `id` = 1')).rejects.toThrow();
    const repository = dataSource.getRepository(AssetFolderEntity);
    const deleted = await repository.findOne({ where: { id: root.id }, withDeleted: true });
    expect(deleted).toMatchObject({ ownerId: '1', createdByAdminId: '9', parentScope: '0', activeMarker: null });
  });
  it('分组统计、查询scope及未分类、批量移动和软删、owners', async () => {
    const root = await folders.create(folder('counts'));
    const first = await images.create(image('count-a', root.id));
    const deleted = await images.create(image('count-b', root.id));
    await images.softDelete(deleted.id);
    const other = await images.create(image('owner-two', null, '2'));
    expect(await images.findById(first.id)).toMatchObject({ ownerId: '1', createdByAdminId: '9', size: 7 });
    expect(await images.findById(deleted.id)).toBeNull();
    expect(await folders.list({ kind: 'all' })).toContainEqual(expect.objectContaining({ id: root.id, imageCount: 1 }));
    expect(await folders.list({ kind: 'owner', ownerId: '1' })).not.toContainEqual(
      expect.objectContaining({ ownerId: '2' })
    );
    const query = {
      scope: { kind: 'owner' as const, ownerId: '1' },
      folderId: root.id,
      keyword: 'count-a',
      page: 1,
      pageSize: 20,
      skip: 0
    };
    expect((await images.list(query)).items.map(x => x.id)).toEqual([first.id]);
    await images.updateFolder(first.id, null);
    expect((await images.list({ ...query, folderId: undefined, unclassified: true })).items.map(x => x.id)).toContain(
      first.id
    );
    await images.updateFolder(first.id, root.id);
    await images.moveToRoot(root.id);
    expect(await images.findById(first.id)).toMatchObject({ folderId: null });
    expect(
      (await images.list({ ...query, scope: { kind: 'all' }, keyword: undefined, folderId: undefined })).items.map(
        x => x.id
      )
    ).toContain(other.id);
    expect(new Set(await images.listOwnerIds())).toEqual(new Set(['1', '2']));
    expect(new Set(await folders.listOwnerIds())).toEqual(new Set(['1', '2']));
    await images.moveFoldersToRoot([]);
    await folders.softDeleteMany([]);
    await expect(images.updateFolder('999999', null)).rejects.toBeInstanceOf(DomainNotFoundError);
    await expect(images.softDelete('999999')).rejects.toBeInstanceOf(DomainNotFoundError);
    await expect(folders.update('999999', { name: 'x' })).rejects.toBeInstanceOf(DomainNotFoundError);
    await expect(folders.softDelete('999999')).rejects.toBeInstanceOf(DomainNotFoundError);
  });
  it('findByName排除自身、改名/移动冲突、后代包含自身且排除软删', async () => {
    const root = await folders.create(folder('tree'));
    const child = await folders.create(folder('branch', root.id));
    const grandchild = await folders.create(folder('leaf', child.id));
    const sibling = await folders.create(folder('sibling', root.id));
    expect(await folders.findByName('1', root.id, 'branch')).toMatchObject({ id: child.id });
    expect(await folders.findByName('1', root.id, 'branch', child.id)).toBeNull();
    expect(await folders.update(child.id, { name: 'branch' })).toMatchObject({ id: child.id });
    await expect(folders.update(sibling.id, { name: 'branch' })).rejects.toBeInstanceOf(DomainConflictError);
    expect(new Set((await folders.listDescendants(root.id)).map(x => x.id))).toEqual(
      new Set([root.id, child.id, grandchild.id, sibling.id])
    );
    expect(await folders.listDescendants('999999')).toEqual([]);
    await folders.softDeleteMany([grandchild.id, sibling.id]);
    expect((await folders.listDescendants(root.id)).map(x => x.id)).toHaveLength(2);
  });
  it('事务回滚目录及图片，事务外拒绝lockOwner，不存在owner拒绝', async () => {
    const root = await folders.create(folder('rollback-root'));
    const saved = await images.create(image('rollback-image', root.id));
    await expect(
      transactions.run(async ({ folders: f, images: i }) => {
        await f.lockOwner('1');
        await i.moveFoldersToRoot([root.id]);
        await f.softDeleteMany([root.id]);
        await f.create(folder('rollback-temporary'));
        throw new Error('rollback');
      })
    ).rejects.toThrow('rollback');
    expect(await folders.findById(root.id)).not.toBeNull();
    expect(await images.findById(saved.id)).toMatchObject({ folderId: root.id });
    expect(await folders.findByName('1', null, 'rollback-temporary')).toBeNull();
    await expect(folders.lockOwner('1')).rejects.toThrow('必须在素材事务中调用');
    await expect(transactions.run(async ({ folders: f }) => f.lockOwner('999999'))).rejects.toBeInstanceOf(
      DomainNotFoundError
    );
  });
  it('事务锁读取启用状态，停用归属禁止新增', async () => {
    await dataSource.query('UPDATE `admin` SET `is_active` = 0 WHERE `id` = 2');
    try {
      await expect(transactions.run(async ({ folders: f }) => f.lockOwner('2', true))).rejects.toMatchObject({
        name: 'ForbiddenException'
      });
      await expect(transactions.run(async ({ folders: f }) => f.lockOwner('2'))).resolves.toBeUndefined();
    } finally {
      await dataSource.query('UPDATE `admin` SET `is_active` = 1 WHERE `id` = 2');
    }
    await expect(transactions.run(async ({ folders: f }) => f.lockOwner('2', true))).resolves.toBeUndefined();
  });
  it('同归属行锁阻塞第二事务直到第一事务提交', async () => {
    let release!: () => void;
    let acquired!: () => void;
    const hold = new Promise<void>(resolve => {
      release = resolve;
    });
    const firstLocked = new Promise<void>(resolve => {
      acquired = resolve;
    });
    const first = transactions.run(async ({ folders: f }) => {
      await f.lockOwner('1');
      acquired();
      await hold;
    });
    await firstLocked;
    let secondLocked = false;
    const second = transactions.run(async ({ folders: f }) => {
      await f.lockOwner('1');
      secondLocked = true;
    });
    try {
      await new Promise(resolve => setTimeout(resolve, 80));
      expect(secondLocked).toBe(false);
    } finally {
      release();
      await Promise.all([first, second]);
    }
    expect(secondLocked).toBe(true);
  });
  it('真实MySQL名称精确比较及关键词字面搜索与内存一致', async () => {
    const { InMemoryAssetImageRepository, InMemoryAssetFolderRepository } =
      await import('#/modules/asset/repositories/in-memory-asset.repository.js');
    const memoryImages = new InMemoryAssetImageRepository();
    const memoryFolders = new InMemoryAssetFolderRepository(memoryImages);
    const root = await folders.create(folder('collation-root'));
    const memoryRoot = await memoryFolders.create(folder('collation-root'));
    for (const name of ['Case', 'case', 'Case ', 'é', 'e\u0301']) {
      const saved = await folders.create(folder(name, root.id));
      await memoryFolders.create(folder(name, memoryRoot.id));
      expect(await folders.findByName('1', root.id, name)).toMatchObject({ id: saved.id, name });
    }
    expect((await folders.listDescendants(root.id)).map(x => x.name).sort()).toEqual(
      (await memoryFolders.listDescendants(memoryRoot.id)).map(x => x.name).sort()
    );
    const names = ['Case%_!\\.png', 'caseXX.png', 'CaseXX.png', 'é.png', 'e\u0301.png', '😀.png'];
    for (const [index, originalName] of names.entries()) {
      await images.create({ ...image(`literal-${index}`, root.id), originalName });
      await memoryImages.create({ ...image(`literal-${index}`, memoryRoot.id), originalName });
    }
    for (const keyword of ['Case', 'case', '%', '_', '!', '\\', 'é', 'e\u0301', '😀']) {
      const query = { scope: { kind: 'owner' as const, ownerId: '1' }, page: 1, pageSize: 100, skip: 0, keyword };
      const mysqlResult = await images.list({ ...query, folderId: root.id });
      const memoryResult = await memoryImages.list({ ...query, folderId: memoryRoot.id });
      expect(new Set(mysqlResult.items.map(x => x.originalName))).toEqual(
        new Set(memoryResult.items.map(x => x.originalName))
      );
      expect(mysqlResult.total).toBe(memoryResult.total);
    }
    const columns: { TABLE_NAME: string; COLUMN_NAME: string; COLLATION_NAME: string }[] = await dataSource.query(
      "SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND ((TABLE_NAME = 'asset_folder' AND COLUMN_NAME = 'name') OR (TABLE_NAME = 'asset_image' AND COLUMN_NAME = 'original_name'))"
    );
    expect(columns).toHaveLength(2);
    for (const column of columns) expect(column.COLLATION_NAME).toBe('utf8mb4_0900_bin');
  });
  it('真实MySQL storageKey包含软删记录仍唯一且映射领域冲突', async () => {
    const input = image('unique-storage-key', null);
    const saved = await images.create(input);
    await expect(images.create({ ...input, ownerId: '2' })).rejects.toBeInstanceOf(DomainConflictError);
    await images.softDelete(saved.id);
    await expect(images.create(input)).rejects.toBeInstanceOf(DomainConflictError);
    const distinct = await images.create({ ...input, storageKey: 'UNIQUE-STORAGE-KEY' });
    expect(distinct.id).not.toBe(saved.id);
    await expect(transactions.run(async ({ images: i }) => i.create(input))).rejects.toBeInstanceOf(
      DomainConflictError
    );
    expect(
      await dataSource.getRepository(AssetImageEntity).findOne({ where: { id: saved.id }, withDeleted: true })
    ).toMatchObject({ storageKey: input.storageKey, deletedAt: expect.any(Date) });
    expect(dataSource.getMetadata(AssetImageEntity).findColumnWithPropertyName('storageKey')?.collation).toBe(
      'utf8mb4_0900_bin'
    );
    const columns: { COLLATION_NAME: string }[] = await dataSource.query(
      "SELECT COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asset_image' AND COLUMN_NAME = 'storage_key'"
    );
    expect(columns[0]?.COLLATION_NAME).toBe('utf8mb4_0900_bin');
  });
  it('实体元数据与真实生成列一致，down/up可再次执行', async () => {
    const runner = dataSource.createQueryRunner();
    try {
      const columns: { EXTRA: string }[] = await runner.query(
        "SELECT EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asset_folder' AND COLUMN_NAME = 'parent_scope'"
      );
      expect(columns[0]?.EXTRA).toBe('STORED GENERATED');
      await new CreateAssetManagement1794003000000().down(runner);
      await new CreateAssetManagement1794003000000().up(runner);
      expect(await folders.list({ kind: 'all' })).toEqual([]);
    } finally {
      await runner.release();
    }
  });
});
