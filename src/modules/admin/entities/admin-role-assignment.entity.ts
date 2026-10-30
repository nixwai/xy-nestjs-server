import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 管理员与角色的分配记录。 */
@Entity({ name: 'admin_role_assignment' })
@Index('uk_admin_role_assignment_admin_id_role_id', ['adminId', 'roleId'], {
  unique: true,
})
@Index('idx_admin_role_assignment_role_id', ['roleId'])
export class AdminRoleAssignmentEntity {
  /** 分配记录主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_admin_role_assignment_id',
  })
  id!: string;

  /** 管理员主键。 */
  @Column({ name: 'admin_id', type: 'bigint', unsigned: true })
  adminId!: string;

  /** 角色主键。 */
  @Column({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  /** 分配创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;

  /** 分配更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;
}
