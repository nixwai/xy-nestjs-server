import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** Refresh Token 请求。 */
export class RefreshTokenDto {
  /** 当前会话的 Refresh Token。 */
  @ApiProperty({ type: String, minLength: 32, maxLength: 256 })
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(256)
  refreshToken!: string;
}
