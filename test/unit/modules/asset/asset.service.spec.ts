import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AssetService } from '#/modules/asset/asset.service.js';
import { PermissionCode as P } from '#/modules/authorization/constants/index.js';

function setup(grants: string[]) {
  const folder = { listOwnerIds: vi.fn(async () => ['3']) };
  const image = { listOwnerIds: vi.fn(async () => ['4']) };
  const admins = {
    listAdmins: vi.fn(async () => ({
      items: [
        { id: '1', username: 'one', isActive: true },
        { id: '2', username: 'empty', isActive: true },
        { id: '3', username: 'folder', isActive: false },
        { id: '4', username: 'image', isActive: false },
        { id: '5', username: 'hidden', isActive: false }
      ],
      hasNextPage: false
    }))
  };
  const auth = { hasPermission: vi.fn(async (_id, code) => grants.includes(code)) };
  return {
    service: new AssetService(folder as never, image as never, admins as never, auth as never),
    folder,
    image
  };
}
describe('AssetService owners', () => {
  it('rejects callers without either all permission', async () => {
    await expect(setup([]).service.listOwners('1')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('returns enabled owners and historical owners only in authorized resources', async () => {
    const { service, image } = setup([P.ASSET_FOLDER_READ_ALL]);
    expect(await service.listOwners('1')).toEqual({
      items: [
        { id: '1', username: 'one', isActive: true },
        { id: '2', username: 'empty', isActive: true },
        { id: '3', username: 'folder', isActive: false }
      ],
      total: 3
    });
    expect(image.listOwnerIds).not.toHaveBeenCalled();
  });
  it('supports image-only full permission', async () => {
    const { service, folder } = setup([P.ASSET_IMAGE_READ_ALL]);
    expect((await service.listOwners('1')).items.map(x => x.id)).toEqual(['1', '2', '4']);
    expect(folder.listOwnerIds).not.toHaveBeenCalled();
  });
});

describe('AssetService owner pagination', () => {
  it('collects owner records across administrator pages', async () => {
    const admins = {
      listAdmins: vi
        .fn()
        .mockResolvedValueOnce({ items: [{ id: '1', username: 'one', isActive: true }], hasNextPage: true })
        .mockResolvedValueOnce({ items: [{ id: '2', username: 'two', isActive: true }], hasNextPage: false })
    };
    const service = new AssetService(
      { listOwnerIds: async () => [] } as never,
      { listOwnerIds: async () => [] } as never,
      admins as never,
      { hasPermission: async () => true } as never
    );
    expect((await service.listOwners('1')).total).toBe(2);
    expect(admins.listAdmins.mock.calls[1][0].page).toBe(2);
  });
});
