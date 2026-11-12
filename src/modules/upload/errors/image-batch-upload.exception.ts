import { PublicBusinessException } from '#/common/errors/index.js';
import type { ImageBatchUploadFailure, ImageBatchUploadResult } from '../types/upload-result.type.js';

const SAFE_FAILURE_REASONS = new Set([
  '图片文件不能为空',
  '仅支持 JPEG、PNG、WebP、GIF 格式的图片',
  '图片处理失败，请检查文件格式',
  '图片上传失败，请稍后重试',
  '图片上传失败',
  '上传失败'
]);

interface SafeImageBatchUploadDetails {
  readonly success: readonly never[];
  readonly failed: readonly ImageBatchUploadFailure[];
  readonly totalCount: number;
  readonly successCount: 0;
}

function sanitizeFilename(filename: string): string {
  return Array.from(filename.replace(/^.*[\\/]/, ''))
    .filter(character => character.charCodeAt(0) >= 32)
    .join('')
    .slice(0, 255);
}

function normalizeDetails(result: ImageBatchUploadResult): SafeImageBatchUploadDetails {
  const failed = Object.freeze(
    result.failed.map(item =>
      Object.freeze({
        filename: sanitizeFilename(item.filename),
        reason: SAFE_FAILURE_REASONS.has(item.reason) ? item.reason : '图片上传失败'
      })
    )
  );
  return Object.freeze({ success: Object.freeze([]), failed, totalCount: failed.length, successCount: 0 });
}

/** 批量图片全部失败时返回脱敏后的公开业务异常。 */
export class ImageBatchUploadException extends PublicBusinessException<SafeImageBatchUploadDetails> {
  constructor(result: ImageBatchUploadResult) {
    super('所有图片上传失败', normalizeDetails(result));
  }
}
