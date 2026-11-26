import { describe, expect, it } from 'vitest';
import { collectFolderSubtreeIds } from '#/modules/asset/utils/asset-folder-subtree.util.js';
import type { AssetFolderRecord } from '#/modules/asset/types/index.js';

/** 构造只关心层级关系的文件夹记录。 */
function createFolder(id: string, parentId: string | null, ownerId = '1'): AssetFolderRecord {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id,
    name: `folder-${id}`,
    parentId,
    ownerId,
    creatorId: ownerId,
    createdAt: now,
    updatedAt: now
  };
}

describe('素材文件夹子树收集', () => {
  it('返回根文件夹自身以及全部子孙文件夹', () => {
    const folders = [
      createFolder('1', null),
      createFolder('2', '1'),
      createFolder('3', '2'),
      createFolder('4', '1'),
      createFolder('5', null)
    ];

    expect(new Set(collectFolderSubtreeIds(folders, '1'))).toEqual(new Set(['1', '2', '3', '4']));
  });

  it('叶子文件夹只返回自身', () => {
    const folders = [createFolder('1', null), createFolder('2', '1')];

    expect(collectFolderSubtreeIds(folders, '2')).toEqual(['2']);
  });

  it('只收集同一父级分支，不串入兄弟文件夹', () => {
    const folders = [createFolder('1', null), createFolder('2', '1'), createFolder('3', '1'), createFolder('4', '3')];

    expect(collectFolderSubtreeIds(folders, '2')).toEqual(['2']);
    expect(new Set(collectFolderSubtreeIds(folders, '3'))).toEqual(new Set(['3', '4']));
  });

  it('父级关系成环时每个文件夹只收集一次', () => {
    const folders = [createFolder('1', '2'), createFolder('2', '1')];

    expect(new Set(collectFolderSubtreeIds(folders, '1'))).toEqual(new Set(['1', '2']));
  });

  it('根文件夹不在集合内时返回空', () => {
    expect(collectFolderSubtreeIds([createFolder('1', null)], '9')).toEqual([]);
  });
});
