import { describe, expect, it } from 'vitest';
import { createPermissionCode } from '../../../../src/modules/authorization/utils/permission-code.util.js';
import { REGISTERED_PERMISSIONS } from '../../../../src/modules/permission/constants/registered-permissions.constant.js';

describe('REGISTERED_PERMISSIONS', () => {
  it('uses the canonical permission code for every registered permission', () => {
    for (const permission of REGISTERED_PERMISSIONS) {
      expect(permission.code).toBe(
        createPermissionCode(permission.resource, permission.method),
      );
    }
  });
});
