import { describe, expect, it } from 'vitest';
import { AdminLoginRequestDto } from '#/modules/auth/dto/admin-login-request.dto.js';
import { createStrictValidationPipe } from '#/common/pipes/strict-validation.pipe.js';

describe('createStrictValidationPipe', () => {
  it('creates a validation pipe for strict request boundaries', () => {
    expect(createStrictValidationPipe()).toBeDefined();
  });

  it('使用 DTO 自己定义的中文校验消息', async () => {
    const pipe = createStrictValidationPipe();

    await expect(
      pipe.transform({ username: 'a', password: '1' }, { type: 'body', metatype: AdminLoginRequestDto, data: 'body' })
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining(['用户名长度不能少于3个字符', '密码密文必须是 Base64 字符串'])
      }
    });
  });

  it('将非白名单字段转换为中文提示', async () => {
    const pipe = createStrictValidationPipe();

    await expect(
      pipe.transform(
        { username: 'admin', password: 'AQ==', unexpected: true },
        { type: 'body', metatype: AdminLoginRequestDto, data: 'body' }
      )
    ).rejects.toMatchObject({
      response: { message: ['不允许提交字段：unexpected'] }
    });
  });
});
