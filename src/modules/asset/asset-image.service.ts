import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import type { PageResult } from '#/common/types/index.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { UploadService } from '../upload/upload.service.js';
import type { UploadImageFile } from '../upload/types/upload-image-file.type.js';
import { AssetAccessPolicy } from './asset-access.policy.js';
import type { AssetImageQueryDto } from './dto/index.js';
import { AssetBatchUploadException, ASSET_UPLOAD_FAILURE } from './errors/asset-batch-upload.exception.js';
import { ASSET_IMAGE_REPOSITORY, ASSET_TRANSACTION_RUNNER } from './repositories/asset-repository.port.js';
import type {
  AssetImageRepository,
  AssetTransactionRunner,
  AssetFolderRepository
} from './repositories/asset-repository.port.js';
import type { AssetImageRecord } from './types/asset.types.js';

type UploadOutcome =
  { kind: 'success'; image: AssetImageRecord } | { kind: 'failure'; filename: string; reason: string };
export interface AssetUploadResult {
  success: AssetImageRecord[];
  failed: { filename: string; reason: string }[];
  totalCount: number;
  successCount: number;
}

@Injectable()
export class AssetImageService {
  private readonly logger = new Logger(AssetImageService.name);
  constructor(
    @Inject(ASSET_IMAGE_REPOSITORY) private readonly images: AssetImageRepository,
    @Inject(ASSET_TRANSACTION_RUNNER) private readonly transactions: AssetTransactionRunner,
    @Inject(AssetAccessPolicy) private readonly access: AssetAccessPolicy,
    @Inject(UploadService) private readonly uploader: UploadService
  ) {}

  async list(actorId: string, query: AssetImageQueryDto, all = false): Promise<PageResult<AssetImageRecord>> {
    if (query.folderId && query.unclassified) throw new BadRequestException('文件夹筛选与未分类筛选不能同时使用');
    const scope = await this.access.queryScope(actorId, 'image', query.ownerId, all);
    return this.images.list({
      page: query.page,
      pageSize: query.pageSize,
      skip: query.skip,
      folderId: query.folderId,
      unclassified: query.unclassified,
      keyword: query.keyword,
      scope
    });
  }

  async upload(
    actorId: string,
    files: UploadImageFile[],
    folderId?: string | null,
    requestedOwnerId?: string
  ): Promise<AssetUploadResult> {
    const ownerId = requestedOwnerId ?? actorId;
    await this.access.assertManage(actorId, ownerId, 'image', PermissionCode.ASSET_IMAGE_UPLOAD);
    await this.access.assertOwnerExists(ownerId, true);
    this.uploader.validateBatch(files);
    if (folderId) await this.access.assertFolderReadable(actorId, ownerId);
    await this.transactions.run(async ({ folders }) => {
      await folders.lockOwner(ownerId);
      await this.assertTargetFolder(folders, ownerId, folderId);
    });
    const outcomes: UploadOutcome[] = [];
    for (let offset = 0; offset < files.length; offset += 3) {
      const batch = await Promise.all(
        files.slice(offset, offset + 3).map(file => this.uploadOne(actorId, ownerId, folderId ?? null, file))
      );
      outcomes.push(...batch);
    }
    const success = outcomes.flatMap(item => (item.kind === 'success' ? [item.image] : []));
    const failed = outcomes.flatMap(item =>
      item.kind === 'failure' ? [{ filename: item.filename, reason: item.reason }] : []
    );
    const result = { success, failed, totalCount: files.length, successCount: success.length };
    if (!success.length) throw new AssetBatchUploadException(result);
    return result;
  }

  async move(
    actorId: string,
    id: string,
    folderId?: string | null,
    requestedOwnerId?: string
  ): Promise<AssetImageRecord> {
    const ownerId = requestedOwnerId ?? actorId;
    await this.access.assertManage(actorId, ownerId, 'image', PermissionCode.ASSET_IMAGE_MOVE);
    if (folderId) await this.access.assertFolderReadable(actorId, ownerId);
    return this.transactions.run(async ({ folders, images }) => {
      await folders.lockOwner(ownerId);
      await this.requireImage(images, id, ownerId);
      await this.assertTargetFolder(folders, ownerId, folderId);
      return images.updateFolder(id, folderId ?? null);
    });
  }

  async delete(actorId: string, id: string, requestedOwnerId?: string): Promise<void> {
    const ownerId = requestedOwnerId ?? actorId;
    await this.access.assertManage(actorId, ownerId, 'image', PermissionCode.ASSET_IMAGE_DELETE);
    await this.transactions.run(async ({ folders, images }) => {
      await folders.lockOwner(ownerId);
      await this.requireImage(images, id, ownerId);
      await images.softDelete(id);
    });
  }

  private async uploadOne(
    actorId: string,
    ownerId: string,
    folderId: string | null,
    file: UploadImageFile
  ): Promise<UploadOutcome> {
    let key: string | undefined;
    try {
      const uploaded = await this.uploader.uploadImage(file, 'asset');
      key = uploaded.storageKey;
      const image = await this.transactions.run(async ({ folders, images }) => {
        await folders.lockOwner(ownerId, true);
        await this.assertTargetFolder(folders, ownerId, folderId);
        return images.create({
          ownerId,
          createdByAdminId: actorId,
          folderId,
          originalName: file.originalname,
          storageKey: uploaded.storageKey,
          url: uploaded.url,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          width: uploaded.width,
          height: uploaded.height
        });
      });
      return { kind: 'success', image };
    } catch (error) {
      if (key) await this.compensate(key, actorId, ownerId);
      this.logger.error(
        `素材上传失败 actor=${actorId} owner=${ownerId} key=${key ?? 'not-uploaded'} type=${error instanceof Error ? error.name : 'unknown'}`
      );
      return { kind: 'failure', filename: file.originalname, reason: this.safeFailure(error, Boolean(key)) };
    }
  }

  private async assertTargetFolder(
    folders: AssetFolderRepository,
    ownerId: string,
    folderId?: string | null
  ): Promise<void> {
    if (!folderId) return;
    const folder = await folders.findById(folderId);
    if (!folder) throw new NotFoundException('目标文件夹不存在');
    if (folder.ownerId !== ownerId) throw new ForbiddenException('图片与目标文件夹必须属于同一用户');
  }

  private async requireImage(repository: AssetImageRepository, id: string, ownerId: string): Promise<AssetImageRecord> {
    const image = await repository.findById(id);
    if (!image) throw new NotFoundException('图片素材不存在');
    if (image.ownerId !== ownerId) throw new ForbiddenException('无权操作该图片素材');
    return image;
  }

  private async compensate(key: string, actorId: string, ownerId: string): Promise<void> {
    try {
      await this.uploader.deleteObject(key);
    } catch (error) {
      this.logger.error(
        `OSS 对象清理失败，需人工处理 key=${key} actor=${actorId} owner=${ownerId} type=${error instanceof Error ? error.name : 'unknown'}`
      );
    }
  }

  private safeFailure(error: unknown, persisted: boolean): string {
    if (error instanceof HttpException && error.getStatus() < 500) {
      const safeMessages: readonly string[] = [
        ASSET_UPLOAD_FAILURE.EMPTY,
        ASSET_UPLOAD_FAILURE.MIME,
        ASSET_UPLOAD_FAILURE.PROCESS
      ];
      return safeMessages.includes(error.message) ? error.message : ASSET_UPLOAD_FAILURE.VALIDATION;
    }
    return persisted ? ASSET_UPLOAD_FAILURE.SAVE : ASSET_UPLOAD_FAILURE.UPLOAD;
  }
}
