import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 微信用户刷新令牌会话数据。 */
@Entity({ name: 'user_session' })
@Index('uk_user_session_token_hash', ['tokenHash'], { unique: true })
@Index('idx_user_session_user_id', ['userId'])
@Index('idx_user_session_family_id', ['sessionFamilyId'])
@Index('idx_user_session_expires_at', ['expiresAt'])
@Index('idx_user_session_replaced_by_session_id', ['replacedBySessionId'])
export class UserSessionEntity {
  /** 会话主键。 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    primaryKeyConstraintName: 'pk_user_session_id'
  })
  id!: string;

  /** 会话归属用户。 */
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  /** 所属会话族标识。 */
  @Column({ name: 'session_family_id', type: 'char', length: 36 })
  sessionFamilyId!: string;

  /** 刷新令牌摘要。 */
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash!: string;

  /** 会话过期时间。 */
  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  /** 会话撤销时间。 */
  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt!: Date | null;

  /** 被替代的后续会话。 */
  @Column({ name: 'replaced_by_session_id', type: 'bigint', unsigned: true, nullable: true })
  replacedBySessionId!: string | null;

  /** 创建时间。 */
  @CreateDateColumn({ name: 'gmt_create', type: 'datetime' })
  createdAt!: Date;

  /** 更新时间。 */
  @UpdateDateColumn({ name: 'gmt_modified', type: 'datetime' })
  updatedAt!: Date;

  /** 最近使用时间。 */
  @Column({ name: 'last_used_at', type: 'datetime', nullable: true })
  lastUsedAt!: Date | null;
}
