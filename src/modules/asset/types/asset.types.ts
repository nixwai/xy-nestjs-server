/** 素材文件夹持久化记录。 */
export interface AssetFolderRecord {
  /** 文件夹 ID。 */
  id: string;
  /** 文件夹名称。 */
  name: string;
  /** 父文件夹 ID，顶层文件夹为空。 */
  parentId: string | null;
  /** 拥有者管理员 ID。 */
  ownerId: string;
  /** 创建者管理员 ID。 */
  creatorId: string;
  /** 创建时间。 */
  createdAt: Date;
  /** 更新时间。 */
  updatedAt: Date;
}

/** 创建文件夹的业务输入，父级与拥有者省略时由服务解析归属。 */
export interface AssetFolderCreateRequest {
  /** 文件夹名称。 */
  name: string;
  /** 父文件夹 ID，省略表示创建顶层文件夹。 */
  parentId?: string | null;
  /** 目标拥有者 ID，省略表示归属操作者本人。 */
  ownerId?: string;
}

/** 新建文件夹的持久化输入。 */
export interface AssetFolderCreateInput {
  /** 文件夹名称。 */
  name: string;
  /** 父文件夹 ID，顶层为空。 */
  parentId: string | null;
  /** 拥有者管理员 ID。 */
  ownerId: string;
  /** 创建者管理员 ID。 */
  creatorId: string;
}

/** 文件夹名称更新输入。 */
export interface AssetFolderUpdateInput {
  /** 更新后的文件夹名称。 */
  name: string;
}

/** 文件夹查询数据范围。 */
export type AssetFolderQueryScope = { kind: 'owner'; ownerId: string } | { kind: 'all' };

/** 素材归属账号信息。 */
export interface AssetFolderOwnerRecord {
  /** 账号 ID。 */
  id: string;
  /** 账号登录名。 */
  username: string;
}

/** 单条文件夹公开信息，附带账号名用于写操作结果回显。 */
export interface AssetFolderItem extends AssetFolderRecord {
  /** 拥有者登录名。 */
  ownerUsername: string;
  /** 创建者登录名。 */
  creatorUsername: string;
}

/** 文件夹树节点，账号信息由 owner 与 creator 承载。 */
export interface AssetFolderTreeNode extends AssetFolderRecord {
  /** 所属账号。 */
  owner: AssetFolderOwnerRecord;
  /** 创建者账号。 */
  creator: AssetFolderOwnerRecord;
  /** 子文件夹节点。 */
  children: AssetFolderTreeNode[];
}

/** 按拥有者分组的文件夹树。 */
export interface AssetFolderOwnerTree {
  /** 树根账号。 */
  owner: AssetFolderOwnerRecord;
  /** 该账号下的顶层文件夹节点。 */
  children: AssetFolderTreeNode[];
}

/** 文件夹树查询结果。 */
export interface AssetFolderTreeResult {
  /** 参与展示的全部账号根节点。 */
  owners: AssetFolderOwnerTree[];
}
