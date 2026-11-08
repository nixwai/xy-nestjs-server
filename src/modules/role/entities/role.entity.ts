import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
/** RBAC 角色。 */
@Entity({ name: 'role' })
@Index('uk_role_code', ['code'], { unique: true })
@Index('idx_role_deleted_at', ['deletedAt'])
@Index('idx_role_page', ['deletedAt', 'createdAt', 'id'])
export class RoleEntity {
  /** 角色主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_role_id'
  })
  id!: string;
  /** 角色编码。 */
  @Column({ type: 'varchar', length: 64 })
  code!: string;
  /** 角色名称。 */
  @Column({ type: 'varchar', length: 128 })
  name!: string;
  /** 角色描述。 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;
  /** 是否启用。 */
  @Column({ type: 'boolean', unsigned: true, default: 1 })
  isActive!: boolean;
  /** 是否由系统维护。 */
  @Column({ name: 'is_system', type: 'boolean', unsigned: true, default: 0 })
  isSystem!: boolean;
  /** 是否禁止删除和普通权限委派。 */
  @Column({ name: 'is_protected', type: 'boolean', unsigned: true, default: 0 })
  isProtected!: boolean;
  /** 软删除时间。 */
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt!: Date | null;
  /** 创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;
  /** 更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;
}
