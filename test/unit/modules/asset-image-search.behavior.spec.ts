import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AssetImageSearchQueryDto } from '#/modules/asset/dto/index.js';
import { InMemoryAssetImageRepository } from '#/modules/asset/repositories/in-memory-asset-image.repository.js';
import type { AssetImageCreateInput } from '#/modules/asset/types/index.js';

/** 构造素材图片入库输入。 */
function createInput(folderId: string, originalName: string): AssetImageCreateInput {
  return {
    folderId,
    ownerId: '1',
    creatorId: '1',
    originalName,
    storageKey: `assets/1/${folderId}/${originalName}`,
    mimeType: 'image/png',
    size: 128,
    width: 320,
    height: 180
  };
}

describe('素材图片搜索契约', () => {
  it('搜索请求接受关键词、可选范围和布尔参数并完成类型转换', async () => {
    const query = plainToInstance(AssetImageSearchQueryDto, {
      keyword: 'logo',
      folderId: '10',
      ownerId: '1',
      all: 'true',
      page: '2',
      pageSize: '6'
    });

    expect(await validate(query)).toHaveLength(0);
    expect(query).toMatchObject({ keyword: 'logo', folderId: '10', ownerId: '1', all: true, page: 2, pageSize: 6 });
  });

  it('缺失关键词、非法范围和越界分页均被拒绝', async () => {
    const noKeyword = plainToInstance(AssetImageSearchQueryDto, { page: 1, pageSize: 6 });
    const blankKeyword = plainToInstance(AssetImageSearchQueryDto, { keyword: '' });
    const longKeyword = plainToInstance(AssetImageSearchQueryDto, { keyword: 'x'.repeat(65) });
    const zeroFolder = plainToInstance(AssetImageSearchQueryDto, { keyword: 'logo', folderId: '0' });
    const textOwner = plainToInstance(AssetImageSearchQueryDto, { keyword: 'logo', ownerId: 'abc' });
    const oversized = plainToInstance(AssetImageSearchQueryDto, { keyword: 'logo', pageSize: 200 });

    expect(await validate(noKeyword)).not.toHaveLength(0);
    expect(await validate(blankKeyword)).not.toHaveLength(0);
    expect(await validate(longKeyword)).not.toHaveLength(0);
    expect(await validate(zeroFolder)).not.toHaveLength(0);
    expect(await validate(textOwner)).not.toHaveLength(0);
    expect(await validate(oversized)).not.toHaveLength(0);
  });

  it('内存仓储跨文件夹按文件名搜索且不区分大小写', async () => {
    const repository = new InMemoryAssetImageRepository();
    const inScope = await repository.create(createInput('10', 'Logo.png'));
    const nested = await repository.create(createInput('11', 'my-logo-v2.PNG'));
    await repository.create(createInput('20', 'logo-out-of-scope.png'));
    await repository.create(createInput('10', 'banner.png'));

    const result = await repository.search({
      folderIds: ['10', '11'],
      keyword: 'logo',
      page: 1,
      pageSize: 10,
      skip: 0
    });

    expect(result.items.map(item => item.id).sort()).toEqual([inScope.id, nested.id].sort());
    expect(result.total).toBe(2);
  });

  it('内存仓储搜索按分页返回并给出翻页标记', async () => {
    const repository = new InMemoryAssetImageRepository();
    for (const name of ['logo-1.png', 'logo-2.png', 'logo-3.png']) {
      await repository.create(createInput('10', name));
    }

    const result = await repository.search({ folderIds: ['10'], keyword: 'logo', page: 2, pageSize: 2, skip: 2 });

    expect(result).toMatchObject({
      total: 3,
      page: 2,
      pageSize: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true
    });
    expect(result.items).toHaveLength(1);
  });

  it('内存仓储在文件夹集合为空时返回空结果', async () => {
    const repository = new InMemoryAssetImageRepository();
    await repository.create(createInput('10', 'logo.png'));

    const result = await repository.search({ folderIds: [], keyword: 'logo', page: 1, pageSize: 10, skip: 0 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
