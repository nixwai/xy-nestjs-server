import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('asset_folder')
@Index('uk_asset_folder_parent_name', ['ownerId', 'parentScope', 'name', 'activeMarker'], { unique: true })
@Index('idx_asset_folder_parent_deleted', ['parentId', 'deletedAt'])
@Index('idx_asset_folder_owner_deleted', ['ownerId', 'deletedAt'])
export class AssetFolderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId!: string | null;
  @Column({
    name: 'parent_scope',
    type: 'bigint',
    unsigned: true,
    asExpression: 'IFNULL(`parent_id`,0)',
    generatedType: 'STORED',
    insert: false,
    update: false
  })
  parentScope!: string;
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
  @Column({ type: 'varchar', length: 128, collation: 'utf8mb4_0900_bin' }) name!: string;
  @Column({ name: 'owner_admin_id', type: 'bigint', unsigned: true })
  ownerId!: string;
  @Column({ name: 'created_by_admin_id', type: 'bigint', unsigned: true })
  createdByAdminId!: string;
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime', precision: 6 }) createdAt!: Date;
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime', precision: 6 }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true }) deletedAt!: Date | null;
}
