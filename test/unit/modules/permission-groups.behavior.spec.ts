import { describe, expect, it } from 'vitest';
import { buildPermissionGroups, countPermissions } from '#/modules/permission/utils/permission-group.util.js';
import {
  getPermissionCategoryName,
  getPermissionCategoryOrder
} from '#/modules/permission/utils/permission-category.util.js';
import { REGISTERED_PERMISSION_GROUPS } from '#/modules/permission/constants/registered-permissions.constant.js';

const permission = (id: string, category: string) => ({
  id,
  code: `${category}.resource.read`,
  name: id,
  description: null,
  category,
  isAssignable: true,
  isProtected: false,
  isActive: true
});

describe('权限目录分组展示', () => {
  it('按注册分类顺序分组，未知分类按标识排序并统计总数', () => {
    const groups = buildPermissionGroups([
      permission('legacy', 'legacy'),
      permission('system', 'system'),
      permission('asset', 'asset')
    ]);

    expect(groups.map(group => group.category)).toEqual(['system', 'asset', 'legacy']);
    expect(groups.find(group => group.category === 'system')?.categoryName).toBe(
      REGISTERED_PERMISSION_GROUPS.find(group => group.category === 'system')?.name
    );
    expect(countPermissions(groups)).toBe(3);
    expect(getPermissionCategoryName('unknown')).toBe('unknown');
    expect(getPermissionCategoryOrder('unknown')).toBe(REGISTERED_PERMISSION_GROUPS.length);
  });
});
