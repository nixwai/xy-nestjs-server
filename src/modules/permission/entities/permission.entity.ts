import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 动态权限目录记录。 */
@Entity({ name: 'permission' })
@Index('uk_permission_code', ['code'], { unique: true })
@Index('idx_permission_category_active', ['category', 'isActive'])
export class PermissionEntity {
  /** 权限主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, primaryKeyConstraintName: 'pk_permission_id' })
  id!: string;

  /** 业务权限编码。 */
  @Column({ type: 'varchar', length: 128 })
  code!: string;

  /** 权限名称。 */
  @Column({ type: 'varchar', length: 128 })
  name!: string;

  /** 权限描述。 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  /** 权限分类。 */
  @Column({ type: 'varchar', length: 64 })
  category!: string;

  /** 是否允许绑定给普通角色。 */
  @Column({ name: 'is_assignable', type: 'tinyint', unsigned: true, default: 1 })
  isAssignable!: boolean;

  /** 是否属于受保护权限。 */
  @Column({ name: 'is_protected', type: 'tinyint', unsigned: true, default: 0 })
  isProtected!: boolean;

  /** 是否启用。 */
  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  isActive!: boolean;

  /** 创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;

  /** 更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;
}
