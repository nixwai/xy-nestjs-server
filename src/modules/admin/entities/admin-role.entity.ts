import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminEntity } from './admin.entity.js';
import { RoleEntity } from '../../role/entities/role.entity.js';

/** 管理员与角色的关联。 */
@Entity({ name: 'admin_roles' })
@Index('uk_admin_roles_admin_role', ['adminId', 'roleId'], { unique: true })
export class AdminRoleEntity {
  /** 关联主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  /** 管理员主键。 */
  @Column({ name: 'admin_id', type: 'bigint', unsigned: true })
  adminId!: string;

  /** 角色主键。 */
  @Column({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  /** 管理员。 */
  @ManyToOne(() => AdminEntity, (admin) => admin.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin!: AdminEntity;

  /** 角色。 */
  @ManyToOne(() => RoleEntity, (role) => role.admins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
