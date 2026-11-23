import { describe, expect, it } from 'vitest';
import { DomainConflictError, DomainNotFoundError, PublicBusinessException } from '#/common/errors/index.js';

class TestBusinessException extends PublicBusinessException<{ safe: string }> {
  constructor() {
    super('业务失败', { safe: 'detail' });
  }
}

describe('统一领域异常契约', () => {
  it('领域异常保留资源语义，公开业务异常只暴露冻结明细', () => {
    expect(new DomainNotFoundError('管理员').message).toBe('管理员不存在');
    expect(new DomainConflictError('用户名').message).toBe('用户名已存在');
    const exception = new TestBusinessException();
    expect(exception.code).toBe(40001);
    expect(exception.data).toEqual({ safe: 'detail' });
    expect(Object.isFrozen(exception.data)).toBe(true);
  });
});
