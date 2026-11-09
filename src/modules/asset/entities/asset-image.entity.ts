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
@Index('idx_asset_image_owner_created', ['createdByAdminId', 'createdAt'])
@Index('idx_asset_image_folder_created', ['folderId', 'createdAt'])
export class AssetImageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  @Column({ name: 'folder_id', type: 'bigint', unsigned: true, nullable: true }) folderId!: string | null;
  @Column({ name: 'original_name', type: 'varchar', length: 255 }) originalName!: string;
  @Column({ type: 'varchar', length: 1024 }) url!: string;
  @Column({ name: 'storage_key', type: 'varchar', length: 512 }) storageKey!: string;
  @Column({ name: 'mime_type', type: 'varchar', length: 128 }) mimeType!: string;
  @Column({ type: 'bigint', unsigned: true }) size!: number;
  @Column({ type: 'int', nullable: true }) width!: number | null;
  @Column({ type: 'int', nullable: true }) height!: number | null;
  @Column({ name: 'created_by_admin_id', type: 'bigint', unsigned: true }) createdByAdminId!: string;
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt!: Date | null;
}
