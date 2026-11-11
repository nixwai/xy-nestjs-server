import { PublicBusinessException } from '#/common/errors/index.js';
import type { AssetImageRecord } from '../types/asset.types.js';
import type { AssetUploadFailedResponseDto } from '../dto/asset-response.dto.js';

/** 批量上传全部失败时可公开的结果。 */
export interface AssetBatchUploadResult {
  success: AssetImageRecord[];
  failed: AssetUploadFailedResponseDto[];
  totalCount: number;
  successCount: number;
}

export const ASSET_UPLOAD_FAILURE = {
  EMPTY: '图片文件不能为空',
  MIME: '仅支持 JPEG、PNG、WebP、GIF 格式的图片',
  PROCESS: '图片处理失败，请检查文件格式',
  VALIDATION: '图片格式、大小、目录或操作权限不符合要求',
  SAVE: '素材保存失败，请稍后重试',
  UPLOAD: '图片上传失败，请稍后重试'
} as const;
const SAFE_REASONS = new Set<string>([...Object.values(ASSET_UPLOAD_FAILURE), '图片上传失败', '上传失败']);

/** 全部失败响应的不可变白名单结构。 */
interface SafeAssetBatchUploadDetails {
  readonly success: readonly never[];
  readonly failed: readonly Readonly<AssetUploadFailedResponseDto>[];
  readonly totalCount: number;
  readonly successCount: 0;
}

/** 只在异常构造时归一化一次，原始记录和原因不得进入公开明细。 */
function normalizeDetails(result: AssetBatchUploadResult): SafeAssetBatchUploadDetails {
  const failed = Object.freeze(
    result.failed.map(item =>
      Object.freeze({
        filename: Array.from(item.filename.replace(/^.*[\\/]/, ''))
          .filter(char => char.charCodeAt(0) >= 32)
          .join('')
          .slice(0, 255),
        reason: SAFE_REASONS.has(item.reason) ? item.reason : '图片上传失败'
      })
    )
  );
  return Object.freeze({ success: Object.freeze([]), failed, totalCount: failed.length, successCount: 0 });
}

/** 只携带白名单明细，不向客户端暴露底层异常。 */
export class AssetBatchUploadException extends PublicBusinessException<SafeAssetBatchUploadDetails> {
  constructor(result: AssetBatchUploadResult) {
    super('所有图片上传失败', normalizeDetails(result));
  }
}
