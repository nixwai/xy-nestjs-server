import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { PermissionCode } from '../authorization/constants/index.js';
import type { AssetQueryScope } from './types/asset.types.js';

export type AssetResource = 'folder' | 'image';
const ALL_PERMISSIONS = {
  folder: PermissionCode.ASSET_FOLDER_READ_ALL,
  image: PermissionCode.ASSET_IMAGE_READ_ALL
} as const;

/** 动作授权、数据范围与目标归属校验；不承担目录层级的一致性规则。 */
@Injectable()
export class AssetAccessPolicy {
  constructor(
    @Inject(AuthorizationService) private readonly authorization: AuthorizationService,
    @Inject(AdminService) private readonly admins: AdminService
  ) {}

  async queryScope(actorId: string, resource: AssetResource, ownerId?: string, all = false): Promise<AssetQueryScope> {
    if (all || (ownerId && ownerId !== actorId)) await this.assertAll(actorId, resource);
    if (ownerId) await this.assertOwnerExists(ownerId);
    return all && !ownerId ? { kind: 'all' } : { kind: 'owner', ownerId: ownerId ?? actorId };
  }

  async assertManage(actorId: string, ownerId: string, resource: AssetResource, action: string): Promise<void> {
    await this.assertPermission(actorId, action);
    if (ownerId !== actorId) await this.assertAll(actorId, resource);
  }

  async assertOwnerExists(ownerId: string, creating = false): Promise<void> {
    const owner = await this.admins.findById(ownerId);
    if (!owner) throw new NotFoundException('素材归属用户不存在');
    if (creating && !owner.isActive) throw new ForbiddenException('不能为已停用用户新增素材');
  }

  async assertFolderReadable(actorId: string, ownerId: string): Promise<void> {
    await this.assertPermission(
      actorId,
      ownerId === actorId ? PermissionCode.ASSET_FOLDER_READ : ALL_PERMISSIONS.folder
    );
  }

  async assertPermission(actorId: string, permission: string): Promise<void> {
    if (!(await this.authorization.hasPermission(actorId, permission)))
      throw new ForbiddenException('无权执行该素材操作');
  }

  private async assertAll(actorId: string, resource: AssetResource): Promise<void> {
    await this.assertPermission(actorId, ALL_PERMISSIONS[resource]);
  }
}
