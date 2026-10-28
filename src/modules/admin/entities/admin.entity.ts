import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminSessionEntity } from './admin-session.entity.js';
import { AdminRoleEntity } from './admin-role.entity.js';

/** 管理员账户数据。 */
@Entity({ name: 'admins' })
@Index('uk_admins_username', ['username'], { unique: true })
export class AdminEntity {
  /** 管理员主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  /** 登录用户名。 */
  @Column({ type: 'varchar', length: 64, collation: 'utf8mb4_bin' })
  username!: string;

  /** scrypt 密码哈希。 */
  @Column({ type: 'varchar', length: 128 })
  passwordHash!: string;

  /** scrypt 随机盐。 */
  @Column({ type: 'varchar', length: 32 })
  passwordSalt!: string;

  /** 是否允许登录。 */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** 是否拥有系统全部权限。 */
  @Column({ type: 'boolean', default: false })
  isSuperAdmin!: boolean;

  /** 是否已软删除。 */
  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  /** 创建时间。 */
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  /** 更新时间。 */
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  /** 管理员的刷新会话。 */
  @OneToMany(() => AdminSessionEntity, (session) => session.admin)
  sessions!: AdminSessionEntity[];

  /** 管理员绑定的角色。 */
  @OneToMany(() => AdminRoleEntity, (relation) => relation.admin)
  roles!: AdminRoleEntity[];
}
