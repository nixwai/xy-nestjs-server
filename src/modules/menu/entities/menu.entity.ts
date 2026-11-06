import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
/** 定义 MenuEntity。 */
@Entity({ name: 'menu' })
@Index('uk_menu_menu_key', ['menuKey'], { unique: true })
@Index('idx_menu_parent_key', ['parentKey'])
export class MenuEntity {
  /** 唯一标识。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  /** 菜单稳定标识。 */
  @Column({ name: 'menu_key', type: 'varchar', length: 128 }) menuKey!: string;
  /** 父级菜单标识。 */
  @Column({ name: 'parent_key', type: 'varchar', length: 128, nullable: true }) parentKey!: string | null;
  /** 菜单展示标题。 */
  @Column({ type: 'varchar', length: 128 }) title!: string;
  /** 请求路径。 */
  @Column({ type: 'varchar', length: 255 }) path!: string;
  /** 菜单显示顺序。 */
  @Column({ type: 'int', default: 0 }) order!: number;
  /** 权限编码。 */
  @Column({ name: 'permission_code', type: 'varchar', length: 128, nullable: true }) permissionCode!: string | null;
  /** 是否仅根管理员可见。 */
  @Column({ name: 'is_root_only', type: 'boolean', unsigned: true, default: 0 }) isRootOnly!: boolean;
  /** 是否启用。 */
  @Column({ name: 'is_active', type: 'boolean', unsigned: true, default: 1 }) isActive!: boolean;
  /** 记录创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' }) createdAt!: Date;
  /** 记录更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' }) updatedAt!: Date;
}
