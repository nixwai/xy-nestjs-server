import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 管理员刷新令牌会话。 */
@Entity({ name: 'admin_session' })
@Index('uk_admin_session_token_hash', ['tokenHash'], { unique: true })
@Index('idx_admin_session_admin_id', ['adminId'])
@Index('idx_admin_session_expires_at', ['expiresAt'])
@Index('idx_admin_session_replaced_by_session_id', ['replacedBySessionId'])
export class AdminSessionEntity {
  /** 会话主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_admin_session_id'
  })
  id!: string;

  /** 所属管理员主键。 */
  @Column({ name: 'admin_id', type: 'bigint', unsigned: true })
  adminId!: string;

  /** 刷新令牌哈希。 */
  @Column({ type: 'char', length: 64 })
  tokenHash!: string;

  /** 会话过期时间。 */
  @Column({ type: 'datetime' })
  expiresAt!: Date;

  /** 会话撤销时间。 */
  @Column({ type: 'datetime', nullable: true })
  revokedAt!: Date | null;

  /** 替换当前会话的新会话主键。 */
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  replacedBySessionId!: string | null;

  /** 会话创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;

  /** 会话更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;

  /** 最近一次使用时间。 */
  @Column({ type: 'datetime', nullable: true })
  lastUsedAt!: Date | null;
}
