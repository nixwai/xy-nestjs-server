import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** 创建角色请求。 */
export class CreateRoleDto {
  @ApiProperty({
    type: String,
    maxLength: 64,
    example: 'operator',
    description: '角色唯一编码，只允许小写字母、数字、冒号、下划线和连字符。',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9:_-]+$/)
  code!: string;

  @ApiProperty({
    type: String,
    maxLength: 128,
    example: '运营人员',
    description: '角色名称。',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: '负责日常运营管理。',
    description: '角色描述。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

/** 更新角色请求。 */
export class UpdateRoleDto {
  @ApiProperty({ type: String, example: '1', description: '待更新角色 ID。' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 128,
    example: '运营人员',
    description: '新的角色名称。',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: '负责日常运营管理。',
    description: '新的角色描述。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: '是否启用该角色。',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** 软删除角色请求。 */
export class SoftDeleteRoleDto {
  @ApiProperty({ type: String, example: '1', description: '待删除角色 ID。' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

/** 角色权限绑定请求。 */
export class RolePermissionBindingDto {
  @ApiProperty({ type: String, example: '1', description: '角色 ID。' })
  @IsString()
  @IsNotEmpty()
  roleId!: string;

  @ApiProperty({ type: String, example: '1', description: '权限 ID。' })
  @IsString()
  @IsNotEmpty()
  permissionId!: string;
}
