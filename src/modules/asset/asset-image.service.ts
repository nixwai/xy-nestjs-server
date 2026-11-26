import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import { PublicBusinessException } from '#/common/errors/index.js';
import { createPageResult } from '#/common/utils/index.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { UploadService } from '../upload/upload.service.js';
import type { UploadImageFile } from '../upload/types/upload-image-file.type.js';
import type { UploadImageResult } from '../upload/types/upload-result.type.js';
import { UPLOAD_CONCURRENCY } from '../upload/upload.constants.js';
import { ASSET_FOLDER_REPOSITORY } from './repositories/asset-repository.port.js';
import type { AssetFolderRepository } from './repositories/asset-repository.port.js';
import { ASSET_IMAGE_REPOSITORY } from './repositories/asset-image-repository.port.js';
import type { AssetImageRepository } from './repositories/asset-image-repository.port.js';
import { collectFolderSubtreeIds } from './utils/index.js';
import type { AssetFolderRecord, AssetImageRecord, AssetImageSearchQuery } from './types/index.js';

/** 图片上传失败项。 */
export interface AssetImageUploadFailure {
  /** 原始文件名。 */
  filename: string;
  /** 对外展示的失败原因。 */
  reason: string;
}

/** 批量素材图片上传结果。 */
export interface AssetImageUploadResult {
  /** 成功保存的素材图片。 */
  success: AssetImageRecord[];
  /** 未保存的图片及原因。 */
  failed: AssetImageUploadFailure[];
  /** 本批次文件总数。 */
  totalCount: number;
  /** 成功数量。 */
  successCount: number;
}

const DEFAULT_UPLOAD_FAILURE_REASON = '图片上传失败，请稍后重试';

/** 批量素材图片全部失败时返回安全的失败明细。 */
export class AssetImageBatchUploadException extends PublicBusinessException<AssetImageUploadResult> {
  /** 创建公开业务异常。 */
  constructor(result: AssetImageUploadResult) {
    super('所有图片上传失败', {
      success: [],
      failed: result.failed,
      totalCount: result.totalCount,
      successCount: 0
    });
  }
}
const SAFE_FAILURE_REASON_PREFIXES = [
  '图片文件不能为空',
  '仅支持 JPEG、PNG、WebP、GIF 格式的图片',
  '图片处理失败，请检查文件格式',
  '图片上传失败，请稍后重试',
  '图片大小不能超过'
];

/** 管理素材图片的查询、上传和文件夹数据范围。 */
@Injectable()
export class AssetImageService {
  private readonly logger = new Logger(AssetImageService.name);

  /** 创建当前实例。 */
  constructor(
    @Inject(ASSET_IMAGE_REPOSITORY) private readonly images: AssetImageRepository,
    @Inject(ASSET_FOLDER_REPOSITORY) private readonly folders: AssetFolderRepository,
    @Inject(AuthorizationService) private readonly authorization: AuthorizationService,
    @Inject(UploadService) private readonly uploadService: UploadService
  ) {}

  /** 查询目标文件夹直属图片，子文件夹记录不会被递归返回。 */
  async list(actorId: string, query: PageQueryDto & { folderId: string }): Promise<PageResult<AssetImageRecord>> {
    const folder = await this.requireFolder(query.folderId);
    await this.assertFolderReadAccess(actorId, folder.ownerId);
    return this.images.list(query);
  }

  /**
   * 按选中范围搜索图片原始文件名，范围优先级为文件夹、账号、查看范围。
   *
   * @param actorId - 当前操作者管理员 ID。
   * @param query - 关键词、搜索范围与分页参数。
   * @throws BadRequestException 关键词去除首尾空白后为空。
   * @throws NotFoundException 限定的文件夹不存在。
   * @throws ForbiddenException 目标范围超出当前账号的数据权限。
   */
  async search(actorId: string, query: AssetImageSearchQuery): Promise<PageResult<AssetImageRecord>> {
    const keyword = query.keyword.trim();
    if (!keyword) throw new BadRequestException('请输入搜索关键词');

    const folderIds = await this.resolveSearchFolderIds(actorId, query);
    if (!folderIds.length) return createPageResult([], 0, query);

    return this.images.search({
      folderIds,
      keyword,
      page: query.page,
      pageSize: query.pageSize,
      skip: query.skip
    });
  }

  /** 将批量图片上传到指定文件夹并保存图片元数据。 */
  async upload(actorId: string, folderId: string, files: readonly UploadImageFile[]): Promise<AssetImageUploadResult> {
    const folder = await this.requireFolder(folderId);
    await this.assertFolderReadAccess(actorId, folder.ownerId);
    if (!files.length) throw new BadRequestException('请选择要上传的图片');

    const prefix = `assets/${folder.ownerId}/${folder.id}`;
    const results: PromiseSettledResult<AssetImageRecord>[] = [];
    for (let offset = 0; offset < files.length; offset += UPLOAD_CONCURRENCY) {
      results.push(
        ...(await Promise.allSettled(
          files.slice(offset, offset + UPLOAD_CONCURRENCY).map(async file => {
            const uploaded = await this.uploadService.uploadImage(file, 'asset', prefix);
            try {
              return await this.images.create(this.toCreateInput(folder, actorId, file, uploaded));
            } catch (error) {
              await this.cleanupUploadedObject(uploaded.storageKey);
              throw error;
            }
          })
        ))
      );
    }

    const success: AssetImageRecord[] = [];
    const failed: AssetImageUploadFailure[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
        return;
      }
      failed.push({
        filename: this.sanitizeFilename(files[index].originalname),
        reason: this.toFailureReason(result.reason)
      });
    });

    if (!success.length) {
      if (failed.every(item => item.reason === DEFAULT_UPLOAD_FAILURE_REASON)) {
        throw new InternalServerErrorException(DEFAULT_UPLOAD_FAILURE_REASON);
      }
      throw new AssetImageBatchUploadException({ success: [], failed, totalCount: files.length, successCount: 0 });
    }
    return { success, failed, totalCount: files.length, successCount: success.length };
  }

  /**
   * 解析搜索范围对应的文件夹 ID 集合，文件夹范围会递归展开为全部子孙文件夹。
   *
   * @param actorId - 当前操作者管理员 ID。
   * @param query - 搜索范围参数。
   * @throws NotFoundException 限定的文件夹不存在。
   * @throws ForbiddenException 目标范围缺少素材读取或全局素材权限。
   */
  private async resolveSearchFolderIds(actorId: string, query: AssetImageSearchQuery): Promise<string[]> {
    if (query.folderId) {
      const folder = await this.requireFolder(query.folderId);
      await this.assertFolderReadAccess(actorId, folder.ownerId);
      const owned = await this.folders.list({ kind: 'owner', ownerId: folder.ownerId });
      return collectFolderSubtreeIds(owned, folder.id);
    }

    if (query.ownerId) {
      await this.assertFolderReadAccess(actorId, query.ownerId);
      return (await this.folders.list({ kind: 'owner', ownerId: query.ownerId })).map(folder => folder.id);
    }

    if (query.all) {
      await this.assertGlobalScopeAccess(actorId);
      return (await this.folders.list({ kind: 'all' })).map(folder => folder.id);
    }

    await this.assertFolderReadAccess(actorId, actorId);
    return (await this.folders.list({ kind: 'owner', ownerId: actorId })).map(folder => folder.id);
  }

  /** 校验跨账号的全量素材范围。 */
  private async assertGlobalScopeAccess(actorId: string): Promise<void> {
    if (!(await this.authorization.hasPermission(actorId, PermissionCode.ASSET_FOLDER_ALL))) {
      throw new ForbiddenException('无权搜索全部账号素材');
    }
  }

  /** 读取有效文件夹，不存在时按资源缺失处理。 */
  private async requireFolder(id: string): Promise<AssetFolderRecord> {
    const folder = await this.folders.findById(id);
    if (!folder) throw new NotFoundException('文件夹不存在');
    return folder;
  }

  /** 校验当前操作者对目标文件夹的数据范围。 */
  private async assertFolderReadAccess(actorId: string, ownerId: string): Promise<void> {
    if (actorId === ownerId) {
      if (!(await this.authorization.hasPermission(actorId, PermissionCode.ASSET_FOLDER_READ))) {
        throw new ForbiddenException('无权访问该素材文件夹');
      }
      return;
    }
    if (!(await this.authorization.hasPermission(actorId, PermissionCode.ASSET_FOLDER_ALL))) {
      throw new ForbiddenException('无权访问该素材文件夹');
    }
  }

  /** 组装素材图片持久化输入。 */
  private toCreateInput(
    folder: AssetFolderRecord,
    actorId: string,
    file: UploadImageFile,
    uploaded: UploadImageResult
  ) {
    return {
      folderId: folder.id,
      ownerId: folder.ownerId,
      creatorId: actorId,
      originalName: this.sanitizeFilename(file.originalname),
      storageKey: uploaded.storageKey,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      width: uploaded.width,
      height: uploaded.height
    };
  }

  /** 清理元数据入库失败后已经写入的对象。 */
  private async cleanupUploadedObject(storageKey: string): Promise<void> {
    try {
      await this.uploadService.deleteObject(storageKey);
    } catch (error: unknown) {
      this.logger.error(`素材图片 OSS 补偿删除失败: ${storageKey}`, error instanceof Error ? error.stack : undefined);
    }
  }

  /** 过滤上传失败原因，避免将底层异常内容返回给客户端。 */
  private toFailureReason(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    const safeReason = SAFE_FAILURE_REASON_PREFIXES.find(reason => message.startsWith(reason));
    return safeReason ? message : DEFAULT_UPLOAD_FAILURE_REASON;
  }

  /** 去除路径信息并限制原始文件名长度。 */
  private sanitizeFilename(filename: string): string {
    return Array.from(filename.replace(/^.*[\\/]/, ''))
      .filter(character => character.charCodeAt(0) >= 32)
      .join('')
      .slice(0, 255);
  }
}
