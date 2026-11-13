import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { AssetFolderEntity } from '#/modules/asset/entities/asset-folder.entity.js';

const entityColumns = getMetadataArgsStorage().columns.filter(item => item.target === AssetFolderEntity);
const entityIndices = getMetadataArgsStorage().indices.filter(item => item.target === AssetFolderEntity);

/** 读取实体属性对应的列定义。 */
function columnOf(propertyName: string) {
  const column = entityColumns.find(item => item.propertyName === propertyName);
  if (!column) throw new Error(`缺少列定义：${propertyName}`);
  return column;
}

describe('AssetFolderEntity 元数据', () => {
  it('表名使用单数 snake_case 且不建立数据库外键', () => {
    const table = getMetadataArgsStorage().tables.find(item => item.target === AssetFolderEntity);

    expect(table?.name).toBe('asset_folder');
    expect(getMetadataArgsStorage().relations.filter(item => item.target === AssetFolderEntity)).toEqual([]);
  });

  it('同级名称唯一约束覆盖拥有者、父级范围、名称与有效标记', () => {
    const unique = entityIndices.find(item => item.name === 'uk_asset_folder_parent_name');

    expect(unique?.unique).toBe(true);
    expect(unique?.columns).toEqual(['ownerId', 'parentScope', 'name', 'activeMarker']);
  });

  it('父级范围与有效标记由数据库生成且不参与写入', () => {
    for (const propertyName of ['parentScope', 'activeMarker']) {
      const options = columnOf(propertyName).options;

      expect(options.asExpression, propertyName).toBeTruthy();
      expect(options.generatedType, propertyName).toBe('STORED');
      expect(options.insert, propertyName).toBe(false);
      expect(options.update, propertyName).toBe(false);
    }
  });

  it('账号与父级引用声明无符号 bigint，记录映射依赖字符串主键', () => {
    for (const propertyName of ['id', 'parentId', 'ownerId', 'creatorId']) {
      const options = columnOf(propertyName).options;

      expect(options.type, propertyName).toBe('bigint');
      expect(options.unsigned, propertyName).toBe(true);
    }
  });

  it('名称列使用二进制排序规则，重名判定区分大小写', () => {
    expect(columnOf('name').options.collation).toBe('utf8mb4_bin');
  });

  it('删除时间列启用软删除过滤', () => {
    expect(columnOf('deletedAt').mode).toBe('deleteDate');
  });
});
