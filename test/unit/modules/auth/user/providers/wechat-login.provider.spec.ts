import { BadGatewayException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UniWechatLoginProvider } from '#/modules/auth/user/providers/wechat-login.provider.js';

function createProvider(overrides: Record<string, unknown> = {}) {
  return new UniWechatLoginProvider(
    new ConfigService({
      wechat: {
        enabled: true,
        appId: 'wx-app-id',
        appSecret: 'app-secret',
        ...overrides
      }
    })
  );
}

function response(payload: unknown, ok = true): Response {
  return { ok, json: vi.fn().mockResolvedValue(payload) } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('UniWechatLoginProvider', () => {
  it('未启用或缺少凭据时拒绝调用微信接口', async () => {
    const provider = createProvider({ enabled: false });

    await expect(provider.exchangeCode('code')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('将微信 code 换成公开身份字段且不暴露 session_key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ openid: 'openid-1', unionid: 'unionid-1', session_key: 'secret' }));
    vi.stubGlobal('fetch', fetchMock);
    const provider = createProvider();

    await expect(provider.exchangeCode(' code ')).resolves.toEqual({ openId: 'openid-1', unionId: 'unionid-1' });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('js_code=code'), expect.any(Object));
  });

  it('微信返回错误码时按无效凭证处理', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ errcode: 40029, errmsg: 'invalid code' })));
    const provider = createProvider();

    await expect(provider.exchangeCode('code')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('微信返回缺少字符串 openid 的响应时拒绝不可信数据', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ openid: 123 })));
    const provider = createProvider();

    await expect(provider.exchangeCode('code')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('微信服务响应非 2xx 时转换为上游错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, false)));
    const provider = createProvider();

    await expect(provider.exchangeCode('code')).rejects.toBeInstanceOf(BadGatewayException);
  });
  it('微信服务网络异常时转换为上游错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const provider = createProvider();

    await expect(provider.exchangeCode('code')).rejects.toBeInstanceOf(BadGatewayException);
  });
});
