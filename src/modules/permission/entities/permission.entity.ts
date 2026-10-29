import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  HttpMethod,
  PermissionResource,
} from '../../authorization/enums/index.js';
import { RolePermissionEntity } from '../../role/entities/role-permission.entity.js';

/** 代码注册的权限目录。 */
@Entity({ name: 'permissions' })
@Index('uk_permissions_code', ['code'], { unique: true })
@Index('idx_permissions_resource_method', ['resource', 'method'])
export class PermissionEntity {
  /** 权限主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
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
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** 创建时间。 */
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  /** 更新时间。 */
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  /** 绑定角色。 */
  @OneToMany(() => RolePermissionEntity, (relation) => relation.permission)
  roles!: RolePermissionEntity[];
}
