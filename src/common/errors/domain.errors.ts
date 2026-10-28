/** 表示领域资源不存在。 */
export class DomainNotFoundError extends Error {
  readonly code = 'DOMAIN_NOT_FOUND';

  constructor(resource: string, message = `${resource}不存在`) {
    super(message);
    this.name = 'DomainNotFoundError';
  }
}

/** 表示领域资源违反唯一性或状态约束。 */
export class DomainConflictError extends Error {
  readonly code = 'DOMAIN_CONFLICT';

  constructor(resource: string, message = `${resource}已存在`) {
    super(message);
    this.name = 'DomainConflictError';
  }
}
