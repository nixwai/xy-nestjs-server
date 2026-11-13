import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

/** 素材文件夹实体。顶层拥有账号通过 ownerId 虚拟展示，不落普通根文件夹记录。 */
@Entity({ name: 'asset_folder' })
@Index('uk_asset_folder_parent_name', ['ownerId', 'parentScope', 'name', 'activeMarker'], { unique: true })
@Index('idx_asset_folder_owner_deleted', ['ownerId', 'deletedAt'])
@Index('idx_asset_folder_parent_deleted', ['parentId', 'deletedAt'])
export class AssetFolderEntity {
  /** 文件夹主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, primaryKeyConstraintName: 'pk_asset_folder_id' })
  id!: string;

  /** 父文件夹主键。 */
  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId!: string | null;

  /** 将 NULL 父级转换为可参与唯一约束的虚拟范围值。 */
  @Column({
    name: 'parent_scope',
    type: 'bigint',
    unsigned: true,
    asExpression: 'IFNULL(`parent_id`,0)',
    generatedType: 'STORED',
    nullable: true,
    insert: false,
    update: false
  })
  parentScope!: string;

  /** 仅对未删除记录参与同级名称唯一约束。 */
  @Column({
    name: 'active_marker',
    type: 'int',
    nullable: true,
    asExpression: 'IF(`deleted_at` IS NULL,1,NULL)',
    generatedType: 'STORED',
    insert: false,
    update: false
  })
  activeMarker!: number | null;

  /** 文件夹名称。 */
  @Column({ type: 'varchar', length: 128, collation: 'utf8mb4_bin' })
  name!: string;

  /** 拥有者管理员主键。 */
  @Column({ name: 'owner_admin_id', type: 'bigint', unsigned: true })
  ownerId!: string;

  /** 创建者管理员主键。 */
  @Column({ name: 'creator_admin_id', type: 'bigint', unsigned: true })
  creatorId!: string;

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
