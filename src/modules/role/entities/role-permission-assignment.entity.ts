import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 角色与权限的关联。 */
@Entity({ name: 'role_permission_assignment' })
@Index('uk_role_permission_assignment_role_id_permission_id', ['roleId', 'permissionId'], {
  unique: true
})
@Index('idx_role_permission_assignment_permission_id', ['permissionId'])
export class RolePermissionAssignmentEntity {
  /** 关联主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_role_permission_assignment_id'
  })
  id!: string;

  /** 角色主键。 */
  @Column({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  /** 权限主键。 */
  @Column({ name: 'permission_id', type: 'bigint', unsigned: true })
  permissionId!: string;

  /** 关联创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;

  /** 关联更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;
}
