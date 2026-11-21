import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

/** 微信用户数据。 */
@Entity({ name: 'user' })
@Index('uk_user_open_id', ['openId'], { unique: true })
@Index('idx_user_deleted_at', ['deletedAt'])
@Index('idx_user_status_created_at', ['isActive', 'createdAt', 'id'])
export class UserEntity {
  /** 用户主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_user_id'
  })
  id!: string;

  /** 微信小程序 openId。 */
  @Column({
    name: 'open_id',
    type: 'varchar',
    length: 64,
    collation: 'utf8mb4_bin',
    nullable: true
  })
  openId!: string | null;

  /** 微信 UnionId。 */
  @Column({ name: 'union_id', type: 'varchar', length: 64, collation: 'utf8mb4_bin', nullable: true })
  unionId!: string | null;

  /** 展示昵称。 */
  @Column({ type: 'varchar', length: 128, nullable: true })
  nickname!: string | null;

  /** 头像地址。 */
  @Column({ name: 'avatar_url', type: 'varchar', length: 512, nullable: true })
  avatarUrl!: string | null;

  /** 是否允许登录和使用服务。 */
  @Column({ name: 'is_active', type: 'boolean', unsigned: true, default: 1 })
  isActive!: boolean;

  /** 最近登录时间。 */
  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt!: Date | null;

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
