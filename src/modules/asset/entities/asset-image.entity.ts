import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

/** 素材图片实体，保存图片与直属文件夹的绑定关系。 */
@Entity({ name: 'asset_image' })
@Index('uk_asset_image_storage_key', ['storageKey'], { unique: true })
@Index('idx_asset_image_folder_deleted_created', ['folderId', 'deletedAt', 'createdAt'])
@Index('idx_asset_image_owner_deleted', ['ownerId', 'deletedAt'])
export class AssetImageEntity {
  /** 素材图片主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, primaryKeyConstraintName: 'pk_asset_image_id' })
  id!: string;

  /** 直属文件夹主键。 */
  @Column({ name: 'folder_id', type: 'bigint', unsigned: true })
  folderId!: string;

  /** 文件夹拥有者管理员主键。 */
  @Column({ name: 'owner_admin_id', type: 'bigint', unsigned: true })
  ownerId!: string;

  /** 上传者管理员主键。 */
  @Column({ name: 'creator_admin_id', type: 'bigint', unsigned: true })
  creatorId!: string;

  /** 用户上传时使用的原始文件名。 */
  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  /** 对象存储中的唯一 Key。 */
  @Column({ name: 'storage_key', type: 'varchar', length: 512 })
  storageKey!: string;

  /** 处理后图片的 MIME 类型。 */
  @Column({ name: 'mime_type', type: 'varchar', length: 64 })
  mimeType!: string;

  /** 处理后图片的字节数。 */
  @Column({ type: 'int', unsigned: true })
  size!: number;

  /** 处理后图片宽度。 */
  @Column({ type: 'int', unsigned: true })
  width!: number;

  /** 处理后图片高度。 */
  @Column({ type: 'int', unsigned: true })
  height!: number;

  /** 软删除时间。 */
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt!: Date | null;

  /** 创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime', precision: 6 })
  createdAt!: Date;

  /** 更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
