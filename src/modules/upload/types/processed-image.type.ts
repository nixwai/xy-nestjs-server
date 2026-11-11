import type { ImageFileExtension } from '../upload-format.strategy.js';
import type { UploadImageResponseDto } from '../dto/index.js';

export type ProcessedImage = Pick<UploadImageResponseDto, 'mimeType' | 'size' | 'width' | 'height'> & {
  buffer: Buffer;
  extension: ImageFileExtension;
};
