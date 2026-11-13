import { describe, expect, it } from 'vitest';
import { InMemoryAssetFolderRepository } from '#/modules/asset/repositories/in-memory-asset.repository.js';

describe('InMemoryAssetFolderRepository', () => {
  it('软删除后隐藏记录并允许同级名称重新创建', async () => {
    const repository = new InMemoryAssetFolderRepository();
    const input = { name: '素材', parentId: null, ownerId: '1', creatorId: '1' };
    const folder = await repository.create(input);

    await repository.softDelete(folder.id);

    expect(await repository.findById(folder.id)).toBeNull();
    await expect(repository.create(input)).resolves.toMatchObject({ name: '素材' });
  });
});
