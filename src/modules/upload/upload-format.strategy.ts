import type { Sharp } from 'sharp';

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';
export type OutputImageFormat = 'jpeg' | 'png' | 'webp';
export type ImageFileExtension = 'jpg' | 'png' | 'webp';

export interface ImageFormatStrategy {
  readonly outputFormat: OutputImageFormat;
  readonly extension: ImageFileExtension;
  readonly mimeType: `image/${OutputImageFormat}`;
  readonly apply: (pipeline: Sharp, quality: number) => Sharp;
}

const jpegStrategy: ImageFormatStrategy = Object.freeze({
  outputFormat: 'jpeg',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  apply: (pipeline: Sharp, quality: number) => pipeline.jpeg({ quality })
});

const pngStrategy: ImageFormatStrategy = Object.freeze({
  outputFormat: 'png',
  extension: 'png',
  mimeType: 'image/png',
  apply: (pipeline: Sharp, quality: number) => pipeline.png({ quality })
});

const webpStrategy: ImageFormatStrategy = Object.freeze({
  outputFormat: 'webp',
  extension: 'webp',
  mimeType: 'image/webp',
  apply: (pipeline: Sharp, quality: number) => pipeline.webp({ quality })
});

export const IMAGE_FORMAT_STRATEGIES: Readonly<Record<SupportedImageFormat, ImageFormatStrategy>> = Object.freeze({
  jpeg: jpegStrategy,
  png: pngStrategy,
  webp: webpStrategy,
  gif: jpegStrategy
});

export function isSupportedImageFormat(format: string | undefined): format is SupportedImageFormat {
  return format !== undefined && Object.hasOwn(IMAGE_FORMAT_STRATEGIES, format);
}
