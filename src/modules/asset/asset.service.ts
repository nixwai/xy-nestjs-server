import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AdminListQueryDto } from '../admin/dto/index.js';
import { AdminService } from '../admin/admin.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { ASSET_FOLDER_REPOSITORY, ASSET_IMAGE_REPOSITORY } from './repositories/asset-repository.port.js';
import type { AssetFolderRepository, AssetImageRepository } from './repositories/asset-repository.port.js';

/** 跨资源汇总素材归属用户，不依赖管理员列表接口的动作权限。 */
@Injectable()
export class AssetService {
  constructor(
    @Inject(ASSET_FOLDER_REPOSITORY) private readonly folderRepository: AssetFolderRepository,
    @Inject(ASSET_IMAGE_REPOSITORY) private readonly imageRepository: AssetImageRepository,
    @Inject(AdminService) private readonly admins: AdminService,
    @Inject(AuthorizationService) private readonly authorization: AuthorizationService
  ) {}

  async listOwners(
    actorId: string
  ): Promise<{ items: { id: string; username: string; isActive: boolean }[]; total: number }> {
    const [folderAll, imageAll] = await Promise.all([
      this.authorization.hasPermission(actorId, PermissionCode.ASSET_FOLDER_READ_ALL),
      this.authorization.hasPermission(actorId, PermissionCode.ASSET_IMAGE_READ_ALL)
    ]);
    if (!folderAll && !imageAll) throw new ForbiddenException('无权查看素材归属用户');
    const ownerIds = new Set([
      ...(folderAll ? await this.folderRepository.listOwnerIds() : []),
      ...(imageAll ? await this.imageRepository.listOwnerIds() : [])
    ]);
    const items: { id: string; username: string; isActive: boolean }[] = [];
    let page = 1;
    for (;;) {
      const query = Object.assign(new AdminListQueryDto(), { page, pageSize: 100 });
      const result = await this.admins.listAdmins(query);
      items.push(
        ...result.items
          .filter(item => item.isActive || ownerIds.has(item.id))
          .map(item => ({ id: item.id, username: item.username, isActive: item.isActive }))
      );
      if (!result.hasNextPage) break;
      page += 1;
    }
    return { items, total: items.length };
  }
}
