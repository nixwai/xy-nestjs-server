import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminEntity } from './admin.entity.js';
import { RoleEntity } from '../../role/entities/role.entity.js';

/** 管理员与角色的关联。 */
@Entity({ name: 'admin_role' })
@Index('uk_admin_role_admin_id_role_id', ['adminId', 'roleId'], {
  unique: true,
})
@Index('idx_admin_role_role_id', ['roleId'])
export class AdminRoleEntity {
  /** 关联主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_admin_role_id',
  })
  id!: string;

  /** 管理员主键。 */
  @Column({ name: 'admin_id', type: 'bigint', unsigned: true })
  adminId!: string;

  /** 角色主键。 */
  @Column({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  /** 关联创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;

  /** 关联更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;

  /** 关联的管理员。 */
  @ManyToOne(() => AdminEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'admin_id' })
  admin!: AdminEntity;

  /** 关联的角色。 */
  @ManyToOne(() => RoleEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
