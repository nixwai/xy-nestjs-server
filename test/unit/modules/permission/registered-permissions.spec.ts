import { describe, expect, it } from 'vitest';
import { REGISTERED_PERMISSIONS } from '#/modules/permission/constants/registered-permissions.constant.js';

const permissionCodePattern = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*)+$/;

describe('REGISTERED_PERMISSIONS', () => {
  it('uses stable business permission codes and explicit assignment boundaries', () => {
    for (const permission of REGISTERED_PERMISSIONS) {
      expect(permission.code).toMatch(permissionCodePattern);
      expect(permission.category).toBeTruthy();
      expect(typeof permission.isAssignable).toBe('boolean');
      expect(typeof permission.isProtected).toBe('boolean');
    }
  });
});
