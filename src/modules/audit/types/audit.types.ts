/** 审计记录写入输入。 */
export interface AuditRecordInput {
  /** 操作者管理员 ID，系统操作为 null。 */
  actorAdminId: string | null;

  /** 操作动作编码。 */
  action: string;

  /** 被操作资源类型。 */
  resourceType: string;

  /** 被操作资源 ID，没有具体资源时省略。 */
  targetId?: string;

  /** 结构化变更摘要，不包含敏感信息。 */
  details?: Record<string, unknown>;

  /** 操作是否成功，省略时按成功记录。 */
  succeeded?: boolean;
}

/** 审计记录游标分页的定位信息。 */
export interface AuditLogCursor {
  /** 游标指向的创建时间。 */
  createdAt: Date;

  /** 游标指向的审计记录 ID。 */
  id: string;
}

/** 审计记录接口响应模型。 */
export interface AuditLogResponse {
  id: string;
  actorAdminId: string | null;
  action: string;
  actionLabel: string;
  resourceType: string;
  resourceTypeLabel: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  succeeded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
