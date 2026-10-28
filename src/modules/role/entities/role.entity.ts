import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminRoleEntity } from '../../admin/entities/admin-role.entity.js';
import { RolePermissionEntity } from './role-permission.entity.js';

/** RBAC 角色。 */
@Entity({ name: 'roles' })
@Index('uk_roles_code', ['code'], { unique: true })
export class RoleEntity {
  /** 角色主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
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
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** 是否已软删除。 */
  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  /** 创建时间。 */
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  /** 更新时间。 */
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  /** 绑定管理员。 */
  @OneToMany(() => AdminRoleEntity, (relation) => relation.role)
  admins!: AdminRoleEntity[];

  /** 绑定权限。 */
  @OneToMany(() => RolePermissionEntity, (relation) => relation.role)
  permissions!: RolePermissionEntity[];
}
