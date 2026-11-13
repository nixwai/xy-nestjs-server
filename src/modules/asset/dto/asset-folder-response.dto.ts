import { ApiProperty } from '@nestjs/swagger';

/** 素材文件夹公开字段。 */
export class AssetFolderBaseResponseDto {
  /** 文件夹 ID。 */
  @ApiProperty({ type: String }) id!: string;
  /** 文件夹名称。 */
  @ApiProperty({ type: String }) name!: string;
  /** 父文件夹 ID，顶层为空。 */
  @ApiProperty({ type: String, nullable: true }) parentId!: string | null;
  /** 拥有者管理员 ID。 */
  @ApiProperty({ type: String }) ownerId!: string;
  /** 创建者管理员 ID。 */
  @ApiProperty({ type: String }) creatorId!: string;
  /** 创建时间。 */
  @ApiProperty({ type: Date }) createdAt!: Date;
  /** 更新时间。 */
  @ApiProperty({ type: Date }) updatedAt!: Date;
}

/** 素材文件夹公开信息，附带账号名用于写操作结果回显。 */
export class AssetFolderResponseDto extends AssetFolderBaseResponseDto {
  /** 拥有者登录名。 */
  @ApiProperty({ type: String }) ownerUsername!: string;
  /** 创建者登录名。 */
  @ApiProperty({ type: String }) creatorUsername!: string;
}

/** 文件夹树中展示的账号信息。 */
export class AssetFolderAccountDto {
  /** 账号 ID。 */
  @ApiProperty({ type: String }) id!: string;
  /** 账号登录名。 */
  @ApiProperty({ type: String }) username!: string;
}

/** 文件夹树节点。 */
export class AssetFolderTreeNodeDto extends AssetFolderBaseResponseDto {
  /** 所属账号。 */
  @ApiProperty({ type: () => AssetFolderAccountDto }) owner!: AssetFolderAccountDto;
  /** 创建者账号。 */
  @ApiProperty({ type: () => AssetFolderAccountDto }) creator!: AssetFolderAccountDto;
  /** 子文件夹节点。 */
  @ApiProperty({ type: () => [AssetFolderTreeNodeDto] }) children!: AssetFolderTreeNodeDto[];
}

/** 文件夹树中的账号根节点。 */
export class AssetFolderOwnerTreeDto {
  /** 树根账号。 */
  @ApiProperty({ type: () => AssetFolderAccountDto }) owner!: AssetFolderAccountDto;
  /** 该账号下的顶层文件夹。 */
  @ApiProperty({ type: () => [AssetFolderTreeNodeDto] }) children!: AssetFolderTreeNodeDto[];
}

/** 文件夹树响应。 */
export class AssetFolderTreeResponseDto {
  /** 参与展示的全部账号根节点。 */
  @ApiProperty({ type: () => [AssetFolderOwnerTreeDto] }) owners!: AssetFolderOwnerTreeDto[];
}
