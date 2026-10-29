import { Controller, Body, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../authorization/decorators/index.js';
import { AuthService } from './auth.service.js';
import {
  AdminLoginDto,
  AuthTokenResponseDto,
  RefreshTokenDto,
} from './dto/index.js';

/** 提供管理员认证接口。 */
@ApiTags('认证')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /** 使用用户名和密码登录。 */
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: HttpStatus.OK, type: AuthTokenResponseDto })
  async login(@Body() body: AdminLoginDto): Promise<AuthTokenResponseDto> {
    return this.authService.login(body.username, body.password);
  }
  /** 轮换 Refresh Token。 */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: HttpStatus.OK, type: AuthTokenResponseDto })
  async refresh(@Body() body: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(body.refreshToken);
  }
  /** 撤销 Refresh Token 会话。 */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: HttpStatus.OK })
  async logout(@Body() body: RefreshTokenDto): Promise<null> {
    return this.authService.logout(body.refreshToken);
  }
}
