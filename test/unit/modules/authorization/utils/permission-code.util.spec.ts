import { describe, expect, it } from 'vitest';
import {
  HttpMethod,
  PermissionResource,
} from '../../../../../src/modules/authorization/enums/index.js';
import { createPermissionCode } from '../../../../../src/modules/authorization/utils/permission-code.util.js';

describe('createPermissionCode', () => {
  it('converts dotted resources into the registered permission format', () => {
    expect(
      createPermissionCode(PermissionResource.ADMIN_SELF, HttpMethod.GET),
    ).toBe('admin:self:GET');
    expect(
      createPermissionCode(PermissionResource.ROLE_PERMISSION, HttpMethod.POST),
    ).toBe('role:permission:POST');
  });
});
