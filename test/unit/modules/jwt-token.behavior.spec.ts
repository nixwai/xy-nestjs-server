import { describe, expect, it } from 'vitest';
import { JwtTokenService } from '#/modules/auth/shared/tokens/jwt-token.service.js';
import { parseDuration, decodeJson, encodeJson } from '#/modules/auth/shared/utils/jwt.util.js';
import type { ConfigService } from '@nestjs/config';

function createService() {
  const config = {
    getOrThrow: (key: string) => (key === 'jwt.secret' ? 'test-secret-with-enough-length' : '15m')
  } as ConfigService;
  return new JwtTokenService(config);
}

describe('访问令牌与有效期解析', () => {
  it('解析秒、分钟、小时和天，拒绝无效格式', () => {
    expect(parseDuration('1s')).toBe(1);
    expect(parseDuration('2m')).toBe(120);
    expect(parseDuration('3h')).toBe(10800);
    expect(parseDuration('4d')).toBe(345600);
    expect(() => parseDuration('15')).toThrow('JWT 有效期配置无效');
  });

  it('签发令牌后可验证身份，签名或 payload 被篡改时拒绝', () => {
    const service = createService();
    const token = service.signAccessToken('admin-1', 'admin');
    expect(service.verifyAccessToken(token)).toMatchObject({ sub: 'admin-1', role: 'admin', type: 'access' });
    const [header, payload, signature] = token.split('.');
    expect(() => service.verifyAccessToken(`${header}.${payload}.invalid`)).toThrow('登录状态无效');
    expect(() => service.verifyAccessToken(`${header}.${encodeJson({ sub: 'admin-1' })}.${signature}`)).toThrow(
      '登录状态无效'
    );
  });

  it('JSON 段编码可往返，非对象内容拒绝', () => {
    const encoded = encodeJson({ value: 'test' });
    expect(decodeJson(encoded)).toEqual({ value: 'test' });
    expect(() => decodeJson(Buffer.from('[]').toString('base64url'))).toThrow('登录状态无效');
  });
});
