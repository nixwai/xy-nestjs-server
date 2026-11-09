import type { PageQueryDto } from '#/common/dto/index.js';
export interface AssetFolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  createdByAdminId: string;
  imageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface AssetImageRecord {
  id: string;
  folderId: string | null;
  originalName: string;
  url: string;
  storageKey: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdByAdminId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface AssetFolderCreateInput {
  name: string;
  parentId: string | null;
  createdByAdminId: string;
}
export interface AssetFolderUpdateInput {
  name: string;
}
export interface AssetImageCreateInput {
  folderId: string | null;
  originalName: string;
  url: string;
  storageKey: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdByAdminId: string;
}
export interface AssetImageQuery extends PageQueryDto {
  folderId?: string;
  keyword?: string;
  createdByAdminId?: string;
}
