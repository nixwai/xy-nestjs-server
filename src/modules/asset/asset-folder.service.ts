import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PermissionCode } from '../authorization/constants/index.js';
import { AssetAccessPolicy } from './asset-access.policy.js';
import type { CreateAssetFolderDto, UpdateAssetFolderDto } from './dto/index.js';
import { ASSET_FOLDER_REPOSITORY, ASSET_TRANSACTION_RUNNER } from './repositories/asset-repository.port.js';
import type { AssetFolderRepository, AssetTransactionRunner } from './repositories/asset-repository.port.js';
import type { AssetFolderRecord } from './types/asset.types.js';

@Injectable()
export class AssetFolderService {
  constructor(
    @Inject(ASSET_FOLDER_REPOSITORY) private readonly folders: AssetFolderRepository,
    @Inject(ASSET_TRANSACTION_RUNNER) private readonly transactions: AssetTransactionRunner,
    @Inject(AssetAccessPolicy) private readonly access: AssetAccessPolicy
  ) {}

  async list(actorId: string, ownerId?: string, all = false): Promise<AssetFolderRecord[]> {
    const scope = await this.access.queryScope(actorId, 'folder', ownerId, all);
    return this.folders.list(scope);
  }

  async create(actorId: string, dto: CreateAssetFolderDto): Promise<AssetFolderRecord> {
    const ownerId = dto.ownerId ?? actorId;
    await this.access.assertManage(actorId, ownerId, 'folder', PermissionCode.ASSET_FOLDER_CREATE);
    await this.access.assertOwnerExists(ownerId, true);
    const name = this.normalizeName(dto.name);
    return this.transactions.run(async ({ folders }) => {
      await folders.lockOwner(ownerId, true);
      if (dto.parentId) {
        const parent = await this.requireFolder(folders, dto.parentId);
        if (parent.ownerId !== ownerId) throw new ForbiddenException('父子文件夹必须属于同一用户');
      }
      await this.assertNameAvailable(folders, ownerId, dto.parentId ?? null, name);
      return folders.create({ name, parentId: dto.parentId ?? null, ownerId, createdByAdminId: actorId });
    });
  }

  async update(actorId: string, id: string, dto: UpdateAssetFolderDto): Promise<AssetFolderRecord> {
    const ownerId = dto.ownerId ?? actorId;
    await this.access.assertManage(actorId, ownerId, 'folder', PermissionCode.ASSET_FOLDER_UPDATE);
    const name = this.normalizeName(dto.name);
    return this.transactions.run(async ({ folders }) => {
      await folders.lockOwner(ownerId);
      const item = await this.requireFolder(folders, id, ownerId);
      await this.assertNameAvailable(folders, ownerId, item.parentId, name, id);
      return folders.update(id, { name });
    });
  }

  async delete(actorId: string, id: string, requestedOwnerId?: string): Promise<void> {
    const ownerId = requestedOwnerId ?? actorId;
    await this.access.assertManage(actorId, ownerId, 'folder', PermissionCode.ASSET_FOLDER_DELETE);
    await this.transactions.run(async ({ folders, images }) => {
      await folders.lockOwner(ownerId);
      await this.requireFolder(folders, id, ownerId);
      const descendants = await folders.listDescendants(id);
      if (descendants.some(item => item.ownerId !== ownerId)) throw new ConflictException('目录归属异常，无法删除');
      const ids = descendants.map(item => item.id);
      await images.moveFoldersToRoot(ids);
      await folders.softDeleteMany(ids);
    });
  }

  private normalizeName(value: string): string {
    const name = value.trim();
    if (!name || name.length > 128) throw new BadRequestException('文件夹名称长度必须为 1 到 128 个字符');
    return name;
  }

  private async requireFolder(
    repository: AssetFolderRepository,
    id: string,
    ownerId?: string
  ): Promise<AssetFolderRecord> {
    const folder = await repository.findById(id);
    if (!folder) throw new NotFoundException('文件夹不存在');
    if (ownerId && folder.ownerId !== ownerId) throw new ForbiddenException('无权操作该文件夹');
    return folder;
  }

  private async assertNameAvailable(
    repository: AssetFolderRepository,
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<void> {
    if (await repository.findByName(ownerId, parentId, name, excludeId))
      throw new ConflictException('同级文件夹名称已存在');
  }
}
