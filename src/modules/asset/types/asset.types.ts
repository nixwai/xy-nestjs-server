export interface AssetFolderRecord {
  id: string;
  /** 大小写敏感、无Unicode归一化的精确名称。 */
  name: string;
  parentId: string | null;
  ownerId: string;
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
  ownerId: string;
  createdByAdminId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface AssetFolderCreateInput {
  /** 大小写敏感、无Unicode归一化的精确名称。 */
  name: string;
  parentId: string | null;
  ownerId: string;
  createdByAdminId: string;
}
export interface AssetFolderUpdateInput {
  name?: string;
  parentId?: string | null;
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
  ownerId: string;
  createdByAdminId: string;
}
export type AssetQueryScope = { kind: 'owner'; ownerId: string } | { kind: 'all' };

export interface AssetImageQuery {
  page: number;
  pageSize: number;
  skip: number;
  scope: AssetQueryScope;
  unclassified?: boolean;
  folderId?: string;
  /** 大小写敏感字面子串，% 和 _ 不作为通配符。 */
  keyword?: string;
}
