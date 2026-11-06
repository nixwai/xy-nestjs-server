import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData, ApiOkResponseEmpty } from '#/common/decorators/index.js';
import { Public } from '../authorization/decorators/index.js';
import { AuthService } from './auth.service.js';
import { PasswordTransportService } from '#/common/security/index.js';
import {
  AdminLoginRequestDto,
  AdminPublicKeyResponseDto,
  AuthTokenResponseDto,
  RefreshTokenRequestDto
} from './dto/index.js';
/** 提供管理员认证、令牌刷新和会话注销接口。 */
@ApiTags('认证')
@ApiCommonResponses()
@Controller('auth')
@Public()
export class AuthController {
  /** 创建当前实例。 */
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(PasswordTransportService) private readonly passwordTransportService: PasswordTransportService
  ) {}

  /** 返回前端加密管理员密码所需的 RSA 公钥。 */
  @Get('admin/public-key')
  @ApiOperation({
    summary: '获取管理员密码加密公钥',
    description: '返回用于 RSA-OAEP-SHA256 加密管理员密码字段的 PKIX PEM 公钥。'
  })
  @ApiOkResponseData(AdminPublicKeyResponseDto, {
    description: '管理员密码传输加密公钥。'
  })
  async publicKey(): Promise<AdminPublicKeyResponseDto> {
    return { publicKey: this.passwordTransportService.getPublicKey() };
  }

  /** 使用用户名和密码登录并创建管理员会话。 */
  @Post('admin/login')
  @ApiOperation({
    summary: '管理员登录',
    description: '校验管理员用户名和密码，返回访问令牌和刷新令牌。'
  })
  @ApiBody({ type: AdminLoginRequestDto, description: '管理员登录凭据。' })
  @ApiOkResponseData(AuthTokenResponseDto, {
    description: '登录成功，返回 accessToken 和 refreshToken。'
  })
  async login(@Body() body: AdminLoginRequestDto): Promise<AuthTokenResponseDto> {
    const password = this.passwordTransportService.decryptPassword(body.password);
    return this.authService.login(body.username, password);
  }

  /** 使用 Refresh Token 轮换管理员会话令牌。 */
  @Post('refresh')
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用当前 refreshToken 获取新的 accessToken 和 refreshToken。'
  })
  @ApiBody({
    type: RefreshTokenRequestDto,
    description: '当前会话的刷新令牌。'
  })
  @ApiOkResponseData(AuthTokenResponseDto, {
    description: '刷新成功，旧 refreshToken 将失效。'
  })
  async refresh(@Body() body: RefreshTokenRequestDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(body.refreshToken);
  }

  /** 撤销管理员的 Refresh Token 会话。 */
  @Post('logout')
  @ApiOperation({
    summary: '注销管理员会话',
    description: '撤销指定 refreshToken 对应的会话，重复注销不会报错。'
  })
  @ApiBody({
    type: RefreshTokenRequestDto,
    description: '需要注销的刷新令牌。'
  })
  @ApiOkResponseEmpty({ description: '注销成功，data 固定为 null。' })
  async logout(@Body() body: RefreshTokenRequestDto): Promise<null> {
    return this.authService.logout(body.refreshToken);
  }
}
