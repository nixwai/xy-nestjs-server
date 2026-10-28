import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** 管理员登录请求。 */
export class AdminLoginDto {
  /** 大小写敏感的管理员用户名。 */
  @ApiProperty({ type: String, minLength: 3, maxLength: 64, example: 'admin' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username!: string;

  /** 管理员密码。 */
  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Admin1234',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password!: string;
}
