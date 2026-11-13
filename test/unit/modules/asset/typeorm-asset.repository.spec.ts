import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { TypeOrmAssetFolderRepository } from '#/modules/asset/repositories/typeorm-asset.repository.js';

/** 构造数据库查询返回的未删除文件夹记录。 */
function createEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    name: '旧名称',
    parentId: null,
    ownerId: '1',
    creatorId: '1',
    parentScope: '0',
    activeMarker: 1,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  };
}

/** 构造被测仓储及其数据仓库替身。 */
function createRepository(entity = createEntity()) {
  const folders = {
    find: vi.fn().mockResolvedValue([entity]),
    findOne: vi.fn().mockResolvedValue(entity),
    create: vi.fn((input: Record<string, unknown>) => input),
    save: vi.fn(async (input: Record<string, unknown>) => ({ ...entity, ...input })),
    softRemove: vi.fn(async (item: unknown) => item),
    createQueryBuilder: vi.fn()
  };
  return { repository: new TypeOrmAssetFolderRepository(folders as never), folders, entity };
}

/** 构造 MySQL 唯一索引冲突异常。 */
function createDuplicateError(indexName: string): QueryFailedError {
  const driverError = Object.assign(new Error(`Duplicate entry for key '${indexName}'`), {
    code: 'ER_DUP_ENTRY',
    sqlMessage: `Duplicate entry for key '${indexName}'`
  });
  return new QueryFailedError('INSERT INTO asset_folder', [], driverError);
}

describe('TypeOrmAssetFolderRepository', () => {
  it('更新时不修改查询得到的实体对象', async () => {
    const { repository, folders, entity } = createRepository();

    const result = await repository.update('1', { name: '新名称' });

    expect(entity.name).toBe('旧名称');
    expect(folders.create).toHaveBeenCalledWith({
      id: '1',
      parentId: null,
      name: '新名称',
      ownerId: '1',
      creatorId: '1',
      deletedAt: null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    });
    expect(result).toMatchObject({ id: '1', name: '新名称', parentId: null });
  });

  it('仅提交领域输入字段，生成列由数据库维护', async () => {
    const { repository, folders } = createRepository();
    const input = { name: '素材', parentId: null, ownerId: '1', creatorId: '1' };

    await repository.create(input);

    expect(folders.create).toHaveBeenCalledWith(input);
  });

  it('同级重名命中唯一索引时转换为领域冲突', async () => {
    const { repository, folders } = createRepository();
    folders.save.mockRejectedValueOnce(createDuplicateError('uk_asset_folder_parent_name'));

    const created = repository.create({ name: '素材', parentId: null, ownerId: '1', creatorId: '1' });

    await expect(created).rejects.toBeInstanceOf(DomainConflictError);
  });

  it('非唯一索引冲突的数据库异常保持原样上抛', async () => {
    const { repository, folders } = createRepository();
    const error = new QueryFailedError('INSERT INTO asset_folder', [], new Error('disk full'));
    folders.save.mockRejectedValueOnce(error);

    const created = repository.create({ name: '素材', parentId: null, ownerId: '1', creatorId: '1' });

    await expect(created).rejects.toBe(error);
  });

  it('记录只保留公开字段并把 bigint 主键转为字符串', async () => {
    const { repository } = createRepository(createEntity({ id: 12, parentId: 7 }));

    const record = await repository.findById('1');

    expect(record).toEqual({
      id: '12',
      name: '旧名称',
      parentId: '7',
      ownerId: '1',
      creatorId: '1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z')
    });
  });

  it('更新与删除的记录不存在时按资源缺失处理', async () => {
    const { repository, folders } = createRepository();
    folders.findOne.mockResolvedValue(null);

    await expect(repository.update('999', { name: '名称' })).rejects.toBeInstanceOf(DomainNotFoundError);
    await expect(repository.softDelete('999')).rejects.toBeInstanceOf(DomainNotFoundError);
  });
});
