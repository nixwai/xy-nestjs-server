import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { UploadService } from '../upload/upload.service.js';
import type { UploadImageFile } from '../upload/types/upload-image-file.type.js';
import { ASSET_FOLDER_REPOSITORY, ASSET_IMAGE_REPOSITORY } from './repositories/asset-repository.port.js';
import type { AssetFolderRepository, AssetImageRepository } from './repositories/asset-repository.port.js';
import type { CreateAssetFolderDto, UpdateAssetFolderDto, AssetImageQueryDto } from './dto/index.js';
import type { AssetFolderRecord } from './types/asset.types.js';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);
  constructor(
    @Inject(ASSET_FOLDER_REPOSITORY) private readonly folders: AssetFolderRepository,
    @Inject(ASSET_IMAGE_REPOSITORY) private readonly images: AssetImageRepository,
    @Inject(UploadService) private readonly uploadService: UploadService,
    @Inject(AuthorizationService) private readonly authorization: AuthorizationService
  ) {}

  async listFolders(adminId: string): Promise<AssetFolderRecord[]> {
    const all = await this.canReadAll(adminId, PermissionCode.ASSET_FOLDER_READ_ALL);
    return this.folders.list(all ? undefined : adminId);
  }

  async createFolder(adminId: string, dto: CreateAssetFolderDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('文件夹名称不能为空');
    if (dto.parentId) {
      const parent = await this.folders.findById(dto.parentId);
      if (!parent) throw new NotFoundException('父文件夹不存在');
      if (
        parent.createdByAdminId !== adminId &&
        !(await this.canReadAll(adminId, PermissionCode.ASSET_FOLDER_READ_ALL))
      ) {
        throw new ForbiddenException('无权使用该文件夹');
      }
    }
    return this.folders.create({ name, parentId: dto.parentId ?? null, createdByAdminId: adminId });
  }

  async updateFolder(adminId: string, id: string, dto: UpdateAssetFolderDto) {
    const folder = await this.requireOwnedFolder(adminId, id);
    if (!dto.name.trim()) throw new BadRequestException('文件夹名称不能为空');
    return this.folders.update(folder.id, { name: dto.name.trim() });
  }

  async deleteFolder(adminId: string, id: string): Promise<void> {
    await this.requireOwnedFolder(adminId, id);
    await this.images.moveToRoot(id);
    await this.folders.softDelete(id);
  }

  async listImages(adminId: string, q: AssetImageQueryDto) {
    const all = await this.canReadAll(adminId, PermissionCode.ASSET_IMAGE_READ_ALL);
    return this.images.list({
      page: q.page,
      pageSize: q.pageSize,
      folderId: q.folderId,
      keyword: q.keyword,
      createdByAdminId: all ? undefined : adminId,
      skip: (q.page - 1) * q.pageSize
    });
  }

  async upload(adminId: string, files: UploadImageFile[], folderId?: string | null) {
    await this.requireWritableFolder(adminId, folderId);
    const results = await Promise.all(
      files.map(async file => {
        try {
          const uploaded = await this.uploadService.uploadImage(file, 'asset');
          const meta = await sharp(file.buffer).metadata();
          try {
            const image = await this.images.create({
              folderId: folderId ?? null,
              originalName: file.originalname,
              url: uploaded.url,
              storageKey: uploaded.storageKey,
              mimeType: file.mimetype,
              size: file.size,
              width: meta.width ?? null,
              height: meta.height ?? null,
              createdByAdminId: adminId
            });
            return { image } as const;
          } catch (error) {
            await this.cleanupUploadedObject(uploaded.storageKey);
            throw error;
          }
        } catch (error) {
          return { filename: file.originalname, reason: this.getErrorMessage(error) } as const;
        }
      })
    );
    const success = results.flatMap(result => ('image' in result ? [result.image] : []));
    const failed = results.flatMap(result => ('filename' in result ? [result] : []));
    if (!success.length) throw new BadRequestException('所有图片上传失败');
    return { success, failed, totalCount: files.length, successCount: success.length };
  }

  async moveImage(adminId: string, id: string, folderId?: string | null) {
    const image = await this.requireOwnedImage(adminId, id);
    await this.requireWritableFolder(adminId, folderId);
    return this.images.updateFolder(image.id, folderId ?? null);
  }

  async deleteImage(adminId: string, id: string): Promise<void> {
    await this.requireOwnedImage(adminId, id);
    await this.images.softDelete(id);
  }

  private async requireOwnedFolder(adminId: string, id: string) {
    const item = await this.folders.findById(id);
    if (!item) throw new NotFoundException('文件夹不存在');
    if (
      item.createdByAdminId !== adminId &&
      !(await this.canReadAll(adminId, PermissionCode.ASSET_FOLDER_READ_ALL))
    )
      throw new ForbiddenException('无权操作该文件夹');
    return item;
  }
  private async requireWritableFolder(adminId: string, folderId?: string | null) {
    if (!folderId) return;
    const folder = await this.folders.findById(folderId);
    if (!folder) throw new NotFoundException('文件夹不存在');
    if (folder.createdByAdminId !== adminId) throw new ForbiddenException('无权使用该文件夹');
  }
  private async requireOwnedImage(adminId: string, id: string) {
    const item = await this.images.findById(id);
    if (!item) throw new NotFoundException('图片素材不存在');
    if (item.createdByAdminId !== adminId) throw new ForbiddenException('无权操作该图片素材');
    return item;
  }
  private canReadAll(adminId: string, code: string) {
    return this.authorization.hasPermission(adminId, code);
  }
  private async cleanupUploadedObject(key: string) {
    try {
      await this.uploadService.deleteObject(key);
    } catch (error) {
      this.logger.error(`OSS 对象清理失败，需人工处理: ${key}`, error instanceof Error ? error.stack : undefined);
    }
  }
  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : '上传失败';
  }
}
