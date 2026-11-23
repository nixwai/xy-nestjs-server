import { describe, expect, it } from 'vitest';
import { AdminLoginRequestDto } from '#/modules/auth/admin/dto/admin-login-request.dto.js';
import { createStrictValidationPipe } from '#/common/pipes/strict-validation.pipe.js';

describe('严格请求校验边界', () => {
  it('保留 DTO 中文校验消息并拒绝未知字段', async () => {
    const pipe = createStrictValidationPipe();
    await expect(
      pipe.transform({ username: 'a', password: '1' }, { type: 'body', metatype: AdminLoginRequestDto, data: 'body' })
    ).rejects.toMatchObject({
      response: { message: expect.arrayContaining(['用户名长度不能少于3个字符', '密码密文必须是 Base64 字符串']) }
    });
    await expect(
      pipe.transform(
        { username: 'admin', password: 'AQ==', unexpected: true },
        { type: 'body', metatype: AdminLoginRequestDto, data: 'body' }
      )
    ).rejects.toMatchObject({ response: { message: ['不允许提交字段：unexpected'] } });
  });
});
