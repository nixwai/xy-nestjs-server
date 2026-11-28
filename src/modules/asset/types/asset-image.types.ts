import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';

/** 素材图片持久化记录。 */
export interface AssetImageRecord {
  /** 素材图片主键。 */
  id: string;
  /** 直属文件夹主键。 */
  folderId: string;
  /** 文件夹拥有者管理员主键。 */
  ownerId: string;
  /** 上传者管理员主键。 */
  creatorId: string;
  /** 用户上传时使用的原始文件名。 */
  originalName: string;
  /** 对象存储中的唯一 Key。 */
  storageKey: string;
  /** 处理后图片的 MIME 类型。 */
  mimeType: string;
  /** 处理后图片的字节数。 */
  size: number;
  /** 处理后图片宽度。 */
  width: number;
  /** 处理后图片高度。 */
  height: number;
  /** 创建时间。 */
  createdAt: Date;
  /** 更新时间。 */
  updatedAt: Date;
}

/** 新建素材图片的持久化输入。 */
/** 素材图片名称更新输入。 */
export interface AssetImageUpdateInput {
  /** 新的原始文件名。 */
  originalName: string;
}

export interface AssetImageCreateInput {
  /** 直属文件夹主键。 */
  folderId: string;
  /** 文件夹拥有者管理员主键。 */
  ownerId: string;
  /** 上传者管理员主键。 */
  creatorId: string;
  /** 用户上传时使用的原始文件名。 */
  originalName: string;
  /** 对象存储中的唯一 Key。 */
  storageKey: string;
  /** 处理后图片的 MIME 类型。 */
  mimeType: string;
  /** 处理后图片的字节数。 */
  size: number;
  /** 处理后图片宽度。 */
  width: number;
  /** 处理后图片高度。 */
  height: number;
}

/** 素材图片分页查询条件。 */
export type AssetImageListQuery = PageQueryDto & { folderId: string };

/** 素材图片分页查询结果。 */
export type AssetImagePageResult = PageResult<AssetImageRecord>;

/** 素材图片搜索条件，范围由服务解析为具体文件夹集合。 */
export type AssetImageSearchQuery = PageQueryDto & {
  /** 图片原始文件名关键词。 */
  keyword: string;
  /** 限定为该文件夹及其全部子孙文件夹。 */
  folderId?: string;
  /** 限定为该账号名下全部文件夹，folderId 存在时忽略。 */
  ownerId?: string;
  /** 未限定范围时是否覆盖全部账号，ownerId 与 folderId 存在时忽略。 */
  all?: boolean;
};

/** 素材图片仓储搜索输入，范围已解析为明确的文件夹集合。 */
export type AssetImageFolderSearchQuery = PageQueryDto & {
  /** 参与搜索的文件夹 ID 集合。 */
  folderIds: string[];
  /** 已去除首尾空白且非空的图片名称关键词。 */
  keyword: string;
};
