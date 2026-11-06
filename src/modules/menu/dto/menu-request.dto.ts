import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createValidationMessages } from '#/common/constants/index.js';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const idValidation = createValidationMessages('菜单 ID');
const titleValidation = createValidationMessages('菜单标题');
const orderValidation = createValidationMessages('菜单排序');
const isActiveValidation = createValidationMessages('启用状态');
/** 菜单展示配置更新请求。 */
export class MenuUpdateRequestDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
  /** 菜单展示标题。 */
  @ApiPropertyOptional({ type: String, maxLength: 128 })
  @IsOptional()
  @IsString({ message: titleValidation.isString })
  @IsNotEmpty({ message: titleValidation.isNotEmpty })
  @MaxLength(128, { message: titleValidation.maxLength(128) })
  title?: string;
  /** 菜单显示顺序。 */
  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsInt({ message: orderValidation.isInt })
  @Min(0, { message: orderValidation.min(0) })
  order?: number;
  /** 是否启用。 */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;
}

/** 菜单启停请求。 */
export class MenuStatusRequestDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
}
