import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { IMAGE_FORMAT_STRATEGIES, isSupportedImageFormat } from '#/modules/upload/upload-format.strategy.js';

describe('图片格式策略', () => {
  it.each([
    ['jpeg', 'jpeg', 'jpg', 'image/jpeg'],
    ['png', 'png', 'png', 'image/png'],
    ['webp', 'webp', 'webp', 'image/webp'],
    ['gif', 'jpeg', 'jpg', 'image/jpeg']
  ] as const)('%s使用明确的输出策略', async (input, output, extension, mimeType) => {
    const strategy = IMAGE_FORMAT_STRATEGIES[input];
    const result = await strategy
      .apply(sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }), 80)
      .toBuffer({ resolveWithObject: true });
    expect(strategy.outputFormat).toBe(output);
    expect(strategy.extension).toBe(extension);
    expect(strategy.mimeType).toBe(mimeType);
    expect(result.info.format).toBe(output);
  });

  it('仅允许已声明的输入格式', () => {
    expect(isSupportedImageFormat('jpeg')).toBe(true);
    expect(isSupportedImageFormat('avif')).toBe(false);
    expect(isSupportedImageFormat(undefined)).toBe(false);
  });
});
