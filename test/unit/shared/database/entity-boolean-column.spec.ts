import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { AdminEntity } from '#/modules/admin/entities/admin.entity.js';
import { AuditLogEntity } from '#/modules/audit/entities/audit-log.entity.js';
import { MenuEntity } from '#/modules/menu/entities/menu.entity.js';
import { PermissionEntity } from '#/modules/permission/entities/permission.entity.js';
import { RoleEntity } from '#/modules/role/entities/role.entity.js';
import '#/shared/persistence.module.js';

/** 具备布尔语义的实体列，列类型必须能被 MySQL 驱动水合为真布尔值。 */
const BOOLEAN_COLUMNS = [
  { entity: AdminEntity, propertyNames: ['isActive', 'isRoot'] },
  { entity: AuditLogEntity, propertyNames: ['succeeded'] },
  { entity: MenuEntity, propertyNames: ['isRootOnly', 'isActive'] },
  { entity: PermissionEntity, propertyNames: ['isAssignable', 'isProtected', 'isActive'] },
  { entity: RoleEntity, propertyNames: ['isActive', 'isSystem', 'isProtected'] }
] as const;

/** 布尔语义实体列的类型联合，用于按实体定位元数据。 */
type EntityClass = (typeof BOOLEAN_COLUMNS)[number]['entity'];

/** 已加载实体的列元数据，导入 persistence 模块即完成注册。 */
const registeredColumns = getMetadataArgsStorage().columns;

/** 读取实体某个属性声明的列类型。 */
function declaredColumnType(entity: EntityClass, propertyName: string): unknown {
  return registeredColumns.find(column => column.target === entity && column.propertyName === propertyName)?.options
    .type;
}

/** 描述列所属实体，兼容元数据中以字符串登记的目标。 */
function describeColumnTarget(target: unknown): string {
  return typeof target === 'string' ? target : ((target as { name?: string })?.name ?? 'unknown');
}

describe('实体布尔列类型', () => {
  it('不得声明裸 tinyint 列，否则驱动会把布尔值水合成数字', () => {
    const offenders = registeredColumns
      .filter(column => column.options.type === 'tinyint')
      .map(column => `${describeColumnTarget(column.target)}.${column.propertyName}`);

    expect(
      offenders,
      '布尔列必须声明 type: boolean；确需存储非布尔小整数时必须显式提供 transformer 并同步更新本测试'
    ).toEqual([]);
  });

  it('布尔语义列必须声明为 boolean 列类型', () => {
    for (const { entity, propertyNames } of BOOLEAN_COLUMNS) {
      for (const propertyName of propertyNames) {
        expect(declaredColumnType(entity, propertyName), `${entity.name}.${propertyName}`).toBe('boolean');
      }
    }
  });

  it('MySQL 驱动应把 boolean 列水合为真布尔值且 DDL 仍为 tinyint', () => {
    const { driver } = new DataSource({
      type: 'mysql',
      database: 'test',
      entities: BOOLEAN_COLUMNS.map(item => item.entity)
    });
    const booleanColumn = { type: 'boolean' } as never;

    expect(driver.prepareHydratedValue(1, booleanColumn)).toBe(true);
    expect(driver.prepareHydratedValue(0, booleanColumn)).toBe(false);
    expect(driver.normalizeType(booleanColumn)).toBe('tinyint');
  });
});
