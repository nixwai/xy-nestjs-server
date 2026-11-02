import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { JwtTokenService } from '#/modules/auth/tokens/jwt-token.service.js';

const service = new JwtTokenService(
  new ConfigService({
    jwt: {
      secret: 'test-only-secret-with-at-least-32-chars',
      accessTokenExpiresIn: '15m'
    }
  })
);

describe('JwtTokenService', () => {
  it('signs and verifies an admin access token', () => {
    const token = service.signAccessToken('1');
    expect(service.verifyAccessToken(token)).toMatchObject({
      sub: '1',
      role: 'admin',
      type: 'access'
    });
  });

  it('rejects a tampered token', () => {
    const token = service.signAccessToken('1');
    expect(() => service.verifyAccessToken(`${token}x`)).toThrow(UnauthorizedException);
  });
});
