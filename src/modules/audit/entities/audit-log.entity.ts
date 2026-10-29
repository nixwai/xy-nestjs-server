import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** RBAC 和管理员变更审计记录。 */
@Entity({ name: 'audit_logs' })
@Index('idx_audit_logs_created_at', ['createdAt'])
@Index('idx_audit_logs_resource_target', ['resourceType', 'targetId'])
@Index('idx_audit_logs_actor_admin_id', ['actorAdminId'])
export class AuditLogEntity {
  /** 审计记录主键。 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string;
  /** 操作者管理员主键。 */
  @Column({
    name: 'actor_admin_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  actorAdminId!: string | null;
  /** 操作动作。 */
  @Column({ type: 'varchar', length: 64 }) action!: string;
  /** 资源类型。 */
  @Column({ name: 'resource_type', type: 'varchar', length: 64 })
  resourceType!: string;
  /** 目标资源主键。 */
  @Column({ name: 'target_id', type: 'varchar', length: 64, nullable: true })
  targetId!: string | null;
  /** 结构化变更摘要。 */
  @Column({ type: 'json', nullable: true }) details!: Record<
    string,
    unknown
  > | null;
  /** 是否成功。 */
  @Column({ type: 'boolean', default: true }) succeeded!: boolean;
  /** 创建时间。 */
  @CreateDateColumn({ type: 'datetime' }) createdAt!: Date;
}
