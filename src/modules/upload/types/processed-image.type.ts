import type { ImageFileExtension } from '../upload-format.strategy.js';

export type ProcessedImage = {
  buffer: Buffer;
  extension: ImageFileExtension;
  mimeType: string;
  size: number;
  width: number;
  height: number;
};
