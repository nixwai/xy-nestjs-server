import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createValidationMessages } from '../../../common/constants/index.js';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const parentIdValidation = createValidationMessages('父级菜单 ID');
const titleValidation = createValidationMessages('菜单标题');
const pathValidation = createValidationMessages('菜单路径');
const iconValidation = createValidationMessages('菜单图标');
const orderValidation = createValidationMessages('菜单排序');
const permissionCodeValidation = createValidationMessages('权限编码');
const idValidation = createValidationMessages('菜单 ID');
const isActiveValidation = createValidationMessages('启用状态');

/** 创建菜单请求。 */
export class MenuCreateRequestDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: parentIdValidation.isString })
  parentId?: string | null;

  @ApiProperty({ type: String, maxLength: 128 })
  @IsString({ message: titleValidation.isString })
  @IsNotEmpty({ message: titleValidation.isNotEmpty })
  @MaxLength(128, { message: titleValidation.maxLength(128) })
  title!: string;

  @ApiProperty({ type: String, maxLength: 255 })
  @IsString({ message: pathValidation.isString })
  @IsNotEmpty({ message: pathValidation.isNotEmpty })
  @MaxLength(255, { message: pathValidation.maxLength(255) })
  path!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: iconValidation.isString })
  icon?: string;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsInt({ message: orderValidation.isInt })
  @Min(0, { message: orderValidation.min(0) })
  order?: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: permissionCodeValidation.isString })
  permissionCode?: string | null;
}

/** 更新菜单请求。 */
export class MenuUpdateRequestDto extends MenuCreateRequestDto {
  @ApiProperty({ type: String })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;
}

/** 菜单启停请求。 */
export class MenuStatusRequestDto {
  @ApiProperty({ type: String })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
}
