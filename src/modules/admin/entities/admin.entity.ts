import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

/** 管理员账户数据。 */
@Entity({ name: 'admin' })
@Index('uk_admin_username', ['username'], { unique: true })
@Index('idx_admin_deleted_at', ['deletedAt'])
@Index('idx_admin_page', ['deletedAt', 'createdAt', 'id'])
export class AdminEntity {
  /** 管理员主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_admin_id'
  })
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
  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  isActive!: boolean;

  /** 是否拥有系统全部权限。 */
  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  isSuperAdmin!: boolean;

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
