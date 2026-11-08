/** 表示请求的领域资源不存在。 */
export class DomainNotFoundError extends Error {
  /** 业务编码。 */
  readonly code = 'DOMAIN_NOT_FOUND';
  /** 创建当前实例。 */
  constructor(resource: string, message = `${resource}不存在`) {
    super(message);
    this.name = 'DomainNotFoundError';
  }
}

/** 表示领域操作违反唯一性或状态约束。 */
export class DomainConflictError extends Error {
  /** 业务编码。 */
  readonly code = 'DOMAIN_CONFLICT';
  /** 创建当前实例。 */
  constructor(resource: string, message = `${resource}已存在`) {
    super(message);
    this.name = 'DomainConflictError';
  }
}
