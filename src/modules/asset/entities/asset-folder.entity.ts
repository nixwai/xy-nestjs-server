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
@Index('uk_asset_folder_parent_name', ['parentId', 'name'], { unique: true })
@Index('idx_asset_folder_owner_deleted', ['createdByAdminId', 'deletedAt'])
export class AssetFolderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true }) parentId!: string | null;
  @Column({ type: 'varchar', length: 128 }) name!: string;
  @Column({ name: 'created_by_admin_id', type: 'bigint', unsigned: true }) createdByAdminId!: string;
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt!: Date | null;
}
