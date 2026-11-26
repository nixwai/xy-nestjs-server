import type { AssetFolderRecord } from '../types/index.js';

/**
 * 收集指定根文件夹及其全部子孙文件夹的 ID。
 *
 * 输入的文件夹集合必须已经排除软删除记录；父级关系成环时每个文件夹只收集一次。
 *
 * @param folders - 同一数据范围内的有效文件夹集合。
 * @param rootId - 子树根文件夹 ID。
 * @returns 包含根文件夹自身在内的子树文件夹 ID 列表；根文件夹不在集合内时返回空数组。
 */
export function collectFolderSubtreeIds(folders: readonly AssetFolderRecord[], rootId: string): string[] {
  const knownIds = new Set(folders.map(folder => folder.id));
  if (!knownIds.has(rootId)) return [];

  const childrenByParent = new Map<string, AssetFolderRecord[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    childrenByParent.set(folder.parentId, [...(childrenByParent.get(folder.parentId) ?? []), folder]);
  }

  const ids: string[] = [rootId];
  const visited = new Set<string>([rootId]);
  for (let index = 0; index < ids.length; index += 1) {
    for (const child of childrenByParent.get(ids[index]) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      ids.push(child.id);
    }
  }

  return ids;
}
