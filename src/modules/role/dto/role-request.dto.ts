import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createValidationMessages } from '#/common/constants/index.js';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength
} from 'class-validator';

const codeValidation = createValidationMessages('角色编码');
const nameValidation = createValidationMessages('角色名称');
const descriptionValidation = createValidationMessages('角色描述');
const idValidation = createValidationMessages('ID');
const isActiveValidation = createValidationMessages('启用状态');
const roleIdValidation = createValidationMessages('角色 ID');
const permissionIdValidation = createValidationMessages('权限 ID');
/** 创建角色请求。 */
export class RoleCreateRequestDto {
  /** 业务编码。 */
  @ApiProperty({
    type: String,
    maxLength: 64,
    example: 'operator',
    description: '角色唯一编码，只允许小写字母、数字、冒号、下划线和连字符。'
  })
  @IsString({ message: codeValidation.isString })
  @IsNotEmpty({ message: codeValidation.isNotEmpty })
  @MaxLength(64, { message: codeValidation.maxLength(64) })
  @Matches(/^[a-z][a-z0-9:_-]+$/, { message: '角色编码格式不正确' })
  code!: string;
  /** 名称。 */
  @ApiProperty({
    type: String,
    maxLength: 128,
    example: '运营人员',
    description: '角色名称。'
  })
  @IsString({ message: nameValidation.isString })
  @IsNotEmpty({ message: nameValidation.isNotEmpty })
  @MaxLength(128, { message: nameValidation.maxLength(128) })
  name!: string;
  /** 资源描述。 */
  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: '负责日常运营管理。',
    description: '角色描述。'
  })
  @IsOptional()
  @IsString({ message: descriptionValidation.isString })
  @MaxLength(255, { message: descriptionValidation.maxLength(255) })
  description?: string;
}

/** 更新角色请求。 */
export class RoleUpdateRequestDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String, example: '1', description: '待更新角色 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
  /** 名称。 */
  @ApiPropertyOptional({
    type: String,
    maxLength: 128,
    example: '运营人员',
    description: '新的角色名称。'
  })
  @IsOptional()
  @IsString({ message: nameValidation.isString })
  @IsNotEmpty({ message: nameValidation.isNotEmpty })
  @MaxLength(128, { message: nameValidation.maxLength(128) })
  name?: string;
  /** 资源描述。 */
  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: '负责日常运营管理。',
    description: '新的角色描述。'
  })
  @IsOptional()
  @IsString({ message: descriptionValidation.isString })
  @MaxLength(255, { message: descriptionValidation.maxLength(255) })
  description?: string;
  /** 是否启用。 */
  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: '是否启用该角色。'
  })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;
}

/** 软删除角色请求。 */
export class RoleSoftDeleteRequestDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String, example: '1', description: '待删除角色 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
}

/** 角色权限批量操作请求。 */
export class RolePermissionBindingRequestDto {
  /** 角色唯一标识。 */
  @ApiProperty({ type: String, example: '1', description: '角色 ID。' })
  @IsString({ message: roleIdValidation.isString })
  @IsNotEmpty({ message: roleIdValidation.isNotEmpty })
  roleId!: string;
  /** 权限唯一标识列表。 */
  @ApiProperty({ type: [String], example: ['1', '2'], description: '待批量处理的权限 ID 列表。' })
  @IsArray({ message: '权限 ID 列表必须是数组' })
  @ArrayNotEmpty({ message: '权限 ID 列表不能为空' })
  @ArrayUnique({ message: '权限 ID 列表不能包含重复项' })
  @IsString({ each: true, message: permissionIdValidation.isString })
  @IsNotEmpty({ each: true, message: permissionIdValidation.isNotEmpty })
  permissionIds!: string[];
}
