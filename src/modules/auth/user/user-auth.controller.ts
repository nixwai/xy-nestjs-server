import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData, ApiOkResponseEmpty } from '#/common/decorators/index.js';
import { Public } from '../../authorization/decorators/index.js';
import { RefreshTokenRequestDto } from '../shared/dto/index.js';
import { UserAuthService } from './user-auth.service.js';
import { DevelopmentLoginRequestDto, UserAuthTokenResponseDto, WechatLoginRequestDto } from './dto/index.js';

/** 提供用户微信登录、开发登录、令牌刷新和会话注销接口。 */
@ApiTags('用户认证')
@ApiCommonResponses()
@Controller('auth')
export class UserAuthController {
  /** 创建当前实例。 */
  constructor(@Inject(UserAuthService) private readonly userAuthService: UserAuthService) {}

  /** 使用 uni.login 返回的微信 code 登录用户。 */
  @Post('wechat/login')
  @Public()
  @ApiOperation({
    summary: '微信用户登录',
    description: '使用 uni.login 返回的一次性微信登录凭证创建或更新用户会话。'
  })
  @ApiBody({ type: WechatLoginRequestDto, description: '微信登录凭证和可选用户展示资料。' })
  @ApiOkResponseData(UserAuthTokenResponseDto, {
    description: '用户登录成功，返回 accessToken 和 refreshToken。'
  })
  async wechatLogin(@Body() body: WechatLoginRequestDto): Promise<UserAuthTokenResponseDto> {
    return this.userAuthService.login(body.code, body.nickname, body.avatarUrl);
  }

  /** 仅开发环境使用免微信注册登录。 */
  @Post('dev/login')
  @Public()
  @ApiExcludeEndpoint()
  @ApiBody({ type: DevelopmentLoginRequestDto, description: '开发测试用户信息。' })
  @ApiOkResponseData(UserAuthTokenResponseDto, { description: '开发测试用户登录成功。' })
  async developmentLogin(
    @Body() body: DevelopmentLoginRequestDto = new DevelopmentLoginRequestDto()
  ): Promise<UserAuthTokenResponseDto> {
    return this.userAuthService.loginForDevelopment(body.nickname);
  }

  /** 使用用户 Refresh Token 轮换会话令牌。 */
  @Post('user/refresh')
  @Public()
  @ApiOperation({ summary: '刷新用户令牌', description: '使用当前用户 refreshToken 获取新的令牌。' })
  @ApiBody({ type: RefreshTokenRequestDto, description: '当前用户 refreshToken。' })
  @ApiOkResponseData(UserAuthTokenResponseDto, { description: '用户令牌刷新成功。' })
  async refresh(@Body() body: RefreshTokenRequestDto): Promise<UserAuthTokenResponseDto> {
    return this.userAuthService.refresh(body.refreshToken);
  }

  /** 撤销用户 Refresh Token 会话。 */
  @Post('user/logout')
  @Public()
  @ApiOperation({ summary: '注销用户会话', description: '撤销指定用户 refreshToken。' })
  @ApiBody({ type: RefreshTokenRequestDto, description: '需要注销的用户刷新令牌。' })
  @ApiOkResponseEmpty({ description: '注销成功，data 固定为 null。' })
  async logout(@Body() body: RefreshTokenRequestDto): Promise<null> {
    return this.userAuthService.logout(body.refreshToken);
  }
}
