import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminEntity } from './admin.entity.js';

/** 管理员刷新令牌会话。 */
@Entity({ name: 'admin_sessions' })
@Index('uk_admin_sessions_token_hash', ['tokenHash'], { unique: true })
@Index('idx_admin_sessions_admin_id', ['adminId'])
export class AdminSessionEntity {
  /** 会话主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
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
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  /** 最近一次使用时间。 */
  @Column({ type: 'datetime', nullable: true })
  lastUsedAt!: Date | null;

  /** 所属管理员。 */
  @ManyToOne(() => AdminEntity, (admin) => admin.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admin_id' })
  admin!: AdminEntity;
}
