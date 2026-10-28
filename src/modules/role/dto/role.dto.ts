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
/** 角色权限绑定请求。 */
export class RolePermissionBindingDto {
  @ApiProperty() @IsString() @IsNotEmpty() roleId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() permissionId!: string;
}
