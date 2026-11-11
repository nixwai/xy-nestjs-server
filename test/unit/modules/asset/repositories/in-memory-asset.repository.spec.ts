import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryAssetFolderRepository,
  InMemoryAssetImageRepository,
  InMemoryAssetTransactionRunner
} from '#/modules/asset/repositories/in-memory-asset.repository.js';
import { DomainConflictError } from '#/common/errors/index.js';

const scope = { kind: 'owner' as const, ownerId: '1' };
const folder = (name: string, parentId: string | null = null, ownerId = '1') => ({
  name,
  parentId,
  ownerId,
  createdByAdminId: '9'
});
const image = (folderId: string | null, ownerId = '1') => ({
  folderId,
  ownerId,
  createdByAdminId: '9',
  originalName: 'test.png',
  storageKey: randomUUID(),
  url: 'https://example.test/test.png',
  mimeType: 'image/png',
  size: 1,
  width: null,
  height: null
});
const query = { scope, page: 1, pageSize: 20, skip: 0 };
function setup() {
  const images = new InMemoryAssetImageRepository();
  const folders = new InMemoryAssetFolderRepository(images);
  const runner = new InMemoryAssetTransactionRunner(folders, images);
  return { folders, images, runner };
}
describe('素材内存仓储契约', () => {
  it('归属与创建人分离，根目录有效名称唯一，软删后可重建', async () => {
    const { folders } = setup();
    const first = await folders.create(folder('same'));
    expect(first).toMatchObject({ ownerId: '1', createdByAdminId: '9' });
    await expect(folders.create(folder('same'))).rejects.toBeInstanceOf(DomainConflictError);
    await folders.create(folder('same', null, '2'));
    expect(await folders.list(scope)).toHaveLength(1);
    expect(await folders.list({ kind: 'all' })).toHaveLength(2);
    expect(await folders.findByName('1', null, 'same', first.id)).toBeNull();
    await folders.softDelete(first.id);
    expect(await folders.findById(first.id)).toBeNull();
    expect((await folders.create(folder('same'))).id).not.toBe(first.id);
  });
  it('同父级去重，改名及移动同样检查，返回含自身后代', async () => {
    const { folders } = setup();
    const root = await folders.create(folder('root'));
    const child = await folders.create(folder('child', root.id));
    const sibling = await folders.create(folder('sibling', root.id));
    await expect(folders.update(sibling.id, { name: 'child' })).rejects.toBeInstanceOf(DomainConflictError);
    const other = await folders.create(folder('child'));
    await expect(folders.update(other.id, { parentId: root.id })).rejects.toBeInstanceOf(DomainConflictError);
    expect(new Set((await folders.listDescendants(root.id)).map(x => x.id))).toEqual(
      new Set([root.id, child.id, sibling.id])
    );
    await folders.softDeleteMany([root.id, child.id, sibling.id]);
    expect(await folders.listDescendants(root.id)).toEqual([]);
    await folders.softDeleteMany([]);
  });
  it('分组计数、未分类及owners仅包含有效记录', async () => {
    const { folders, images } = setup();
    const root = await folders.create(folder('root'));
    await images.create(image(root.id));
    const deleted = await images.create({ ...image(root.id), storageKey: 'deleted' });
    await images.softDelete(deleted.id);
    await images.create({ ...image(null), storageKey: 'root' });
    await images.create({ ...image(null, '2'), storageKey: 'other' });
    expect(await folders.list(scope)).toEqual([expect.objectContaining({ id: root.id, imageCount: 1 })]);
    expect(await folders.findById(root.id)).toMatchObject({ imageCount: 0 });
    expect((await images.list({ ...query, unclassified: true })).total).toBe(1);
    expect(new Set(await images.listOwnerIds())).toEqual(new Set(['1', '2']));
    expect(await folders.listOwnerIds()).toEqual(['1']);
    await images.moveFoldersToRoot([root.id]);
    expect((await images.list({ ...query, unclassified: true })).total).toBe(2);
    await images.moveFoldersToRoot([]);
  });
  it('失败事务回滚目录和图片，成功事务提交', async () => {
    const { folders, images, runner } = setup();
    const root = await folders.create(folder('root'));
    const saved = await images.create(image(root.id));
    await expect(
      runner.run(async ({ folders: txFolders, images: txImages }) => {
        await txFolders.lockOwner('1');
        await txImages.moveFoldersToRoot([root.id]);
        await txFolders.softDeleteMany([root.id]);
        await txFolders.create(folder('temporary'));
        throw new Error('rollback');
      })
    ).rejects.toThrow('rollback');
    expect(await folders.findById(root.id)).not.toBeNull();
    expect(await images.findById(saved.id)).toMatchObject({ folderId: root.id });
    expect(await folders.findByName('1', null, 'temporary')).toBeNull();
    await runner.run(async ({ folders: txFolders }) => {
      await txFolders.lockOwner('1');
      await txFolders.create(folder('committed'));
    });
    expect(await folders.findByName('1', null, 'committed')).not.toBeNull();
  });
  it('并发事务串行执行且失败不覆盖其他提交', async () => {
    const { folders, runner } = setup();
    const results = await Promise.allSettled([
      runner.run(async ({ folders: tx }) => {
        await tx.lockOwner('1');
        await tx.create(folder('same'));
      }),
      runner.run(async ({ folders: tx }) => {
        await tx.lockOwner('1');
        await tx.create(folder('same'));
      })
    ]);
    expect(results.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    expect(await folders.list(scope)).toHaveLength(1);
  });
  it('记录副本不暴露可变日期', async () => {
    const { folders, images } = setup();
    const root = await folders.create(folder('root'));
    const originalTime = root.createdAt.getTime();
    root.createdAt.setTime(0);
    expect((await folders.findById(root.id))?.createdAt.getTime()).toBe(originalTime);
    const saved = await images.create(image(null));
    const originalImageTime = saved.createdAt.getTime();
    saved.createdAt.setTime(0);
    expect((await images.findById(saved.id))?.createdAt.getTime()).toBe(originalImageTime);
  });
});

it('内存lockOwner携带可选管理员仓储并保留至事务副本', async () => {
  const { InMemoryAdminRepository } = await import('#/modules/admin/repositories/in-memory-admin.repository.js');
  const admins = new InMemoryAdminRepository();
  const admin = await admins.create({ username: 'owner', passwordHash: 'test-hash', passwordSalt: 'test-salt' });
  const images = new InMemoryAssetImageRepository();
  const folders = new InMemoryAssetFolderRepository(images, admins);
  const runner = new InMemoryAssetTransactionRunner(folders, images);
  await expect(runner.run(async ({ folders: f }) => f.lockOwner('missing', true))).rejects.toMatchObject({
    name: 'DomainNotFoundError'
  });
  await admins.update(admin.id, { isActive: false });
  await expect(runner.run(async ({ folders: f }) => f.lockOwner(admin.id, true))).rejects.toMatchObject({
    name: 'ForbiddenException'
  });
  await expect(runner.run(async ({ folders: f }) => f.lockOwner(admin.id))).resolves.toBeUndefined();
  await admins.update(admin.id, { isActive: true });
  await expect(runner.run(async ({ folders: f }) => f.lockOwner(admin.id, true))).resolves.toBeUndefined();
});

it('内存软删保留tombstone，所有默认读取排除且批量操作不改变历史记录', async () => {
  const { folders, images, runner } = setup();
  const parent = await folders.create(folder('history-root'));
  const child = await folders.create(folder('history-child', parent.id));
  const onlyDeletedOwner = await folders.create(folder('owner-only-deleted', null, '7'));
  const deleted = await images.create({ ...image(child.id, '7'), storageKey: 'deleted-image' });
  await images.softDelete(deleted.id);
  await folders.softDeleteMany([child.id, onlyDeletedOwner.id]);
  // 存储适配器的保留策略不增加生产API；仅在此守卫中检查底层保留记录。
  const folderStore = Reflect.get(folders, 'items') as Map<string, { deletedAt: Date | null }>;
  const imageStore = Reflect.get(images, 'items') as Map<string, { deletedAt: Date | null; folderId: string | null }>;
  expect(folderStore.get(child.id)?.deletedAt).toBeInstanceOf(Date);
  expect(folderStore.get(onlyDeletedOwner.id)?.deletedAt).toBeInstanceOf(Date);
  expect(imageStore.get(deleted.id)?.deletedAt).toBeInstanceOf(Date);
  const before = structuredClone(imageStore.get(deleted.id));
  await images.moveFoldersToRoot([child.id]);
  expect((Reflect.get(images, 'items') as typeof imageStore).get(deleted.id)).toEqual(before);
  expect(await folders.findById(child.id)).toBeNull();
  expect(await images.findById(deleted.id)).toBeNull();
  expect(await folders.findByName('1', parent.id, 'history-child')).toBeNull();
  expect((await folders.list({ kind: 'all' })).map(x => x.id)).toEqual([parent.id]);
  expect((await folders.listDescendants(parent.id)).map(x => x.id)).toEqual([parent.id]);
  expect(await folders.listDescendants(child.id)).toEqual([]);
  expect(await folders.listOwnerIds()).not.toContain('7');
  expect(await images.listOwnerIds()).not.toContain('7');
  expect((await images.list({ ...query, scope: { kind: 'all' } })).total).toBe(0);
  expect(images.countByFolder().get(child.id)).toBeUndefined();
  await expect(images.updateFolder(deleted.id, null)).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  await expect(folders.update(child.id, { name: 'new' })).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  await expect(images.softDelete(deleted.id)).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  await expect(folders.softDelete(child.id)).rejects.toMatchObject({ name: 'DomainNotFoundError' });
  const next = await folders.create(folder('history-child', parent.id));
  expect(next.id).not.toBe(child.id);
  await runner.run(async ({ folders: f, images: i }) => {
    await f.lockOwner('1');
    await f.create(folder('commit-after-delete'));
    await i.create({ ...image(null), storageKey: 'committed' });
  });
  expect((Reflect.get(folders, 'items') as typeof folderStore).get(child.id)?.deletedAt).toBeInstanceOf(Date);
  expect((Reflect.get(images, 'items') as typeof imageStore).get(deleted.id)).toEqual(before);
});

it('内存名称使用精确比较，搜索为大小写敏感字面子串', async () => {
  const { folders, images } = setup();
  for (const name of ['Case', 'case', 'Case ', 'é', 'e\u0301']) await folders.create(folder(name));
  expect(await folders.list(scope)).toHaveLength(5);
  for (const name of ['Case', 'case', 'Case ', 'é', 'e\u0301'])
    expect(await folders.findByName('1', null, name)).toMatchObject({ name });
  const names = ['Case%_!\\.png', 'caseXX.png', 'CaseXX.png', 'é.png', 'e\u0301.png', '😀.png'];
  for (const originalName of names) await images.create({ ...image(null), originalName, storageKey: originalName });
  for (const keyword of ['Case', 'case', '%', '_', '!', '\\', 'é', 'e\u0301', '😀']) {
    const result = await images.list({ ...query, keyword });
    expect(new Set(result.items.map(x => x.originalName))).toEqual(
      new Set(names.filter(name => name.includes(keyword)))
    );
  }
});

it('storageKey全局唯一且软删后仍占用，大小写按精确值区分', async () => {
  const { images, runner } = setup();
  const input = { ...image(null), storageKey: 'unique-key' };
  const saved = await images.create(input);
  await expect(images.create({ ...input, ownerId: '2' })).rejects.toBeInstanceOf(DomainConflictError);
  await images.softDelete(saved.id);
  await expect(images.create(input)).rejects.toBeInstanceOf(DomainConflictError);
  await runner.run(async ({ images: txImages }) => {
    await expect(txImages.create(input)).rejects.toBeInstanceOf(DomainConflictError);
    await txImages.create({ ...input, storageKey: 'UNIQUE-KEY' });
  });
  await expect(images.create({ ...input, storageKey: 'UNIQUE-KEY' })).rejects.toBeInstanceOf(DomainConflictError);
  expect((await images.list(query)).total).toBe(1);
});
