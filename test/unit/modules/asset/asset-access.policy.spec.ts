import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssetAccessPolicy } from '#/modules/asset/asset-access.policy.js';
import { PermissionCode as P } from '#/modules/authorization/constants/index.js';

function setup(granted: string[] = []) {
  const authorization = { hasPermission: vi.fn(async (_id: string, code: string) => granted.includes(code)) };
  const admins = { findById: vi.fn(async (id: string) => (id === '404' ? null : { id, isActive: id !== '3' })) };
  return { policy: new AssetAccessPolicy(authorization as never, admins as never), authorization, admins };
}
describe('AssetAccessPolicy', () => {
  it('defaults to the actor owner scope', async () => {
    const { policy } = setup();
    await expect(policy.queryScope('1', 'folder', undefined, false)).resolves.toEqual({ kind: 'owner', ownerId: '1' });
  });
  it('requires resource-specific all permission for all queries', async () => {
    const { policy } = setup([P.ASSET_FOLDER_READ_ALL]);
    await expect(policy.queryScope('1', 'folder', undefined, true)).resolves.toEqual({ kind: 'all' });
    await expect(policy.queryScope('1', 'image', undefined, true)).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('requires both action and all permission to manage another owner', async () => {
    const { policy } = setup([P.ASSET_FOLDER_CREATE]);
    await expect(policy.assertManage('1', '2', 'folder', P.ASSET_FOLDER_CREATE)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    const allowed = setup([P.ASSET_FOLDER_CREATE, P.ASSET_FOLDER_READ_ALL]);
    await expect(allowed.policy.assertManage('1', '2', 'folder', P.ASSET_FOLDER_CREATE)).resolves.toBeUndefined();
    await expect(allowed.policy.assertManage('1', '1', 'folder', P.ASSET_FOLDER_DELETE)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });
  it('rejects missing owners and creation for disabled owners', async () => {
    const { policy } = setup();
    await expect(policy.assertOwnerExists('404')).rejects.toBeInstanceOf(NotFoundException);
    await expect(policy.assertOwnerExists('3', true)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(policy.assertOwnerExists('3')).resolves.toBeUndefined();
  });
  it('requires folder read scope to select another owners directory', async () => {
    const { policy } = setup([P.ASSET_IMAGE_READ_ALL, P.ASSET_IMAGE_MOVE]);
    await expect(policy.assertFolderReadable('1', '2')).rejects.toBeInstanceOf(ForbiddenException);
    const allowed = setup([P.ASSET_FOLDER_READ_ALL]);
    await expect(allowed.policy.assertFolderReadable('1', '2')).resolves.toBeUndefined();
  });
});
