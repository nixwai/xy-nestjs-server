import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** 分页查询参数。 */
export class ListQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
    description: '页码，从 1 开始。',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: '每页条数，范围 1-100。',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

/** 创建管理员请求。 */
export class CreateAdminDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 64,
    example: 'operator01',
    description: '管理员登录用户名，只允许字母、数字、点、下划线和连字符。',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username!: string;

  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Admin1234',
    description: '管理员登录密码，至少包含字母和数字。',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password!: string;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    example: false,
    description: '是否创建为超级管理员。',
  })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '创建超级管理员时必填的当前登录管理员密码。',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;
}

/** 更新管理员请求。 */
export class UpdateAdminDto {
  @ApiProperty({ type: String, example: '1', description: '待更新管理员 ID。' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 3,
    maxLength: 64,
    example: 'operator01',
    description: '新的登录用户名。',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username?: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'NewAdmin1234',
    description: '新的登录密码，至少包含字母和数字。',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: '是否允许该管理员继续登录。',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: '是否设置为超级管理员。',
  })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '修改密码或超级管理员状态时必填的当前登录管理员密码。',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;
}

/** 删除管理员请求。 */
export class SoftDeleteAdminDto {
  @ApiProperty({ type: String, example: '1', description: '待删除管理员 ID。' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '当前登录管理员密码。',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;
}

/** 管理员角色绑定请求。 */
export class AdminRoleBindingDto {
  @ApiProperty({ type: String, example: '2', description: '管理员 ID。' })
  @IsString()
  @IsNotEmpty()
  adminId!: string;

  @ApiProperty({ type: String, example: '1', description: '角色 ID。' })
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
