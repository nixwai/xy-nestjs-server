import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity.js';
import { PermissionEntity } from '../../permission/entities/permission.entity.js';

/** 角色与权限的关联。 */
@Entity({ name: 'role_permissions' })
@Index('uk_role_permissions_role_permission', ['roleId', 'permissionId'], {
  unique: true,
})
export class RolePermissionEntity {
  /** 关联主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  /** 角色主键。 */
  @Column({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  /** 权限主键。 */
  @Column({ name: 'permission_id', type: 'bigint', unsigned: true })
  permissionId!: string;

  /** 角色。 */
  @ManyToOne(() => RoleEntity, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  /** 权限。 */
  @ManyToOne(() => PermissionEntity, (permission) => permission.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission!: PermissionEntity;
}
