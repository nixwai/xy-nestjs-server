import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'menu' })
@Index('idx_menu_parent_id', ['parentId'])
@Index('idx_menu_deleted_at', ['deletedAt'])
export class MenuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true }) parentId!: string | null;
  @Column({ type: 'varchar', length: 128 }) title!: string;
  @Column({ type: 'varchar', length: 255 }) path!: string;
  @Column({ type: 'varchar', length: 128, nullable: true }) icon!: string | null;
  @Column({ type: 'int', default: 0 }) order!: number;
  @Column({ name: 'permission_code', type: 'varchar', length: 128, nullable: true }) permissionCode!: string | null;
  @Column({ name: 'is_active', type: 'tinyint', unsigned: true, default: 1 }) isActive!: boolean;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt!: Date | null;
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' }) updatedAt!: Date;
}
