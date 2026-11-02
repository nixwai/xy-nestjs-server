import { ApiProperty } from '@nestjs/swagger';
import { createValidationMessages } from '#/common/constants/index.js';
import { IsNotEmpty, IsString } from 'class-validator';

const idValidation = createValidationMessages('权限 ID');

/** 权限启停请求。 */
export class PermissionStatusRequestDto {
  @ApiProperty({ type: String, example: '1', description: '待变更权限 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
}
