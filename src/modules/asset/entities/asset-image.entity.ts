import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('asset_image')
@Index('idx_asset_image_owner_created', ['ownerId', 'createdAt', 'id'])
@Index('idx_asset_image_folder_created', ['folderId', 'createdAt', 'id'])
@Index('idx_asset_image_deleted', ['deletedAt'])
@Index('idx_asset_image_original_name', ['originalName'])
@Index('uk_asset_image_storage_key', ['storageKey'], { unique: true })
export class AssetImageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  @Column({ name: 'folder_id', type: 'bigint', unsigned: true, nullable: true })
  folderId!: string | null;
  @Column({ name: 'original_name', type: 'varchar', length: 255, collation: 'utf8mb4_0900_bin' }) originalName!: string;
  @Column({ type: 'varchar', length: 1024 }) url!: string;
  @Column({ name: 'storage_key', type: 'varchar', length: 512, collation: 'utf8mb4_0900_bin' }) storageKey!: string;
  @Column({ name: 'mime_type', type: 'varchar', length: 128 }) mimeType!: string;
  @Column({ type: 'bigint', unsigned: true }) size!: number;
  @Column({ type: 'int', nullable: true }) width!: number | null;
  @Column({ type: 'int', nullable: true }) height!: number | null;
  @Column({ name: 'owner_admin_id', type: 'bigint', unsigned: true })
  ownerId!: string;
  @Column({ name: 'created_by_admin_id', type: 'bigint', unsigned: true })
  createdByAdminId!: string;
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime', precision: 6 }) createdAt!: Date;
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime', precision: 6 }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true }) deletedAt!: Date | null;
}
