import { describe, expect, it } from 'vitest';
import { ImageBatchUploadException } from '#/modules/upload/errors/image-batch-upload.exception.js';

describe('ImageBatchUploadException', () => {
  it('应返回脱敏且不可变的失败明细', () => {
    const exception = new ImageBatchUploadException({
      success: [],
      failed: [
        { filename: 'C:\\tmp\\photo.png\u0000', reason: '底层数据库异常 SQL secret' },
        { filename: 'a'.repeat(300), reason: '图片上传失败，请稍后重试' }
      ],
      totalCount: 2,
      successCount: 0
    });

    expect(exception.message).toBe('所有图片上传失败');
    expect(exception.data).toEqual({
      success: [],
      failed: [
        { filename: 'photo.png', reason: '图片上传失败' },
        { filename: 'a'.repeat(255), reason: '图片上传失败，请稍后重试' }
      ],
      totalCount: 2,
      successCount: 0
    });
    expect(exception.data).not.toContain('SQL');
    expect(Object.isFrozen(exception.data)).toBe(true);
    expect(Object.isFrozen(exception.data.failed)).toBe(true);
    expect(Object.isFrozen(exception.data.failed[0])).toBe(true);
  });
});
