import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'menu' })
@Index('uk_menu_menu_key', ['menuKey'], { unique: true })
@Index('idx_menu_parent_key', ['parentKey'])
export class MenuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  @Column({ name: 'menu_key', type: 'varchar', length: 128 }) menuKey!: string;
  @Column({ name: 'parent_key', type: 'varchar', length: 128, nullable: true }) parentKey!: string | null;
  @Column({ type: 'varchar', length: 128 }) title!: string;
  @Column({ type: 'varchar', length: 255 }) path!: string;
  @Column({ type: 'int', default: 0 }) order!: number;
  @Column({ name: 'permission_code', type: 'varchar', length: 128, nullable: true }) permissionCode!: string | null;
  @Column({ name: 'is_root_only', type: 'tinyint', unsigned: true, default: 0 }) isRootOnly!: boolean;
  @Column({ name: 'is_active', type: 'tinyint', unsigned: true, default: 1 }) isActive!: boolean;
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' }) updatedAt!: Date;
}
