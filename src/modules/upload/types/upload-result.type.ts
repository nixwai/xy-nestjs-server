import type { UploadImageFile } from './upload-image-file.type.js';

export interface StoredObject {
  storageKey: string;
  url: string;
}

export interface ObjectStorage {
  put(key: string, content: Buffer, mimeType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
export type UploadInputFile = UploadImageFile;

export interface UploadImageResult {
  url: string;
  storageKey: string;
  category: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export interface UploadBatchResult {
  success: UploadImageResult[];
  failed: { filename: string; reason: string }[];
  totalCount: number;
  successCount: number;
}
