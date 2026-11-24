import {
  BadGatewayException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONFIG_KEYS } from '#/config/config.constants.js';

/** 微信统一登录服务返回的安全身份字段。 */
export interface WechatLoginResult {
  /** 微信小程序 openId。 */
  openId: string;
  /** 微信 UnionId。 */
  unionId?: string;
}

/** 微信统一登录服务调用契约。 */
export interface WechatLoginProvider {
  /** 使用 uni.login 返回的 code 换取微信身份。 */
  exchangeCode(code: string): Promise<WechatLoginResult>;
}

/** 微信统一登录服务注入令牌。 */
export const WECHAT_LOGIN_PROVIDER = Symbol('WECHAT_LOGIN_PROVIDER');

/** 通过微信 jscode2session 实现 uni.login 的服务端换票。 */
@Injectable()
export class UniWechatLoginProvider implements WechatLoginProvider {
  /** 创建当前实例。 */
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  /** 使用一次性 code 换取 openId，不向业务层暴露 session_key。 */
  async exchangeCode(code: string): Promise<WechatLoginResult> {
    const enabled = this.configService.get<boolean>(`${CONFIG_KEYS.wechat}.enabled`, false);
    const appId = this.configService.get<string>(`${CONFIG_KEYS.wechat}.appId`, '');
    const appSecret = this.configService.get<string>(`${CONFIG_KEYS.wechat}.appSecret`, '');
    if (!enabled || !appId || !appSecret) {
      throw new ServiceUnavailableException('微信登录暂未配置');
    }

    const normalizedCode = typeof code === 'string' ? code.trim() : '';
    if (!normalizedCode) {
      throw new UnauthorizedException('微信登录凭证无效');
    }

    const params = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: normalizedCode,
      grant_type: 'authorization_code'
    });
    let response: Response;
    try {
      response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`, {
        signal: AbortSignal.timeout(5000)
      });
    } catch (error: unknown) {
      throw new BadGatewayException('微信登录服务暂不可用', { cause: error });
    }
    if (!response.ok) {
      throw new BadGatewayException('微信登录服务暂不可用');
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error: unknown) {
      throw new BadGatewayException('微信登录服务返回数据无效', { cause: error });
    }
    if (!isWechatSessionResponse(payload) || (payload.errcode !== undefined && payload.errcode !== 0)) {
      throw new UnauthorizedException('微信登录凭证无效');
    }
    if (typeof payload.openid !== 'string' || !payload.openid.length) {
      throw new BadGatewayException('微信登录服务返回数据无效');
    }
    return {
      openId: payload.openid,
      ...(payload.unionid ? { unionId: payload.unionid } : {})
    };
  }
}

/** 校验微信登录换票响应的最小安全结构。 */
function isWechatSessionResponse(value: unknown): value is {
  openid?: string;
  unionid?: string;
  errcode?: number;
} {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    (payload.openid === undefined || typeof payload.openid === 'string') &&
    (payload.unionid === undefined || typeof payload.unionid === 'string') &&
    (payload.errcode === undefined || typeof payload.errcode === 'number')
  );
}
