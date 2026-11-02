import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { HttpMethod, PermissionResource } from '../../authorization/enums/index.js';

/** 代码注册的权限目录。 */
@Entity({ name: 'permission' })
@Index('uk_permission_code', ['code'], { unique: true })
@Index('idx_permission_resource_method', ['resource', 'method'])
export class PermissionEntity {
  /** 权限主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_permission_id'
  })
  id!: string;

  /** 权限唯一编码。 */
  @Column({ type: 'varchar', length: 128 })
  code!: string;

  /** 资源编码。 */
  @Column({ type: 'varchar', length: 64 })
  resource!: PermissionResource;

  /** HTTP 方法。 */
  @Column({ type: 'varchar', length: 16 })
  method!: HttpMethod;

  /** 权限名称。 */
  @Column({ type: 'varchar', length: 128 })
  name!: string;

  /** 权限描述。 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

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
