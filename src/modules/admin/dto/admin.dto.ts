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
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
/** 创建管理员请求。 */
export class CreateAdminDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username!: string;
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSuperAdmin?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;
}
/** 更新管理员请求。 */
export class UpdateAdminDto {
  @ApiProperty() @IsString() @IsNotEmpty() id!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  username?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSuperAdmin?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;
}
/** 删除管理员请求。 */
export class RemoveAdminDto {
  @ApiProperty() @IsString() @IsNotEmpty() id!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword?: string;
}
/** 创建角色请求。 */
export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9:_-]+$/)
  code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(128) name!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
/** 更新角色请求。 */
export class UpdateRoleDto {
  @ApiProperty() @IsString() @IsNotEmpty() id!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
/** 删除角色请求。 */
export class RemoveRoleDto {
  @ApiProperty() @IsString() @IsNotEmpty() id!: string;
}
/** 绑定管理员角色请求。 */
export class AdminRoleBindingDto {
  @ApiProperty() @IsString() @IsNotEmpty() adminId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() roleId!: string;
}
/** 绑定角色权限请求。 */
export class RolePermissionBindingDto {
  @ApiProperty() @IsString() @IsNotEmpty() roleId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() permissionId!: string;
}
/** 权限启停请求。 */
export class PermissionStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() id!: string;
}
