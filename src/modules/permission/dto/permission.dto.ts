import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** 权限启停请求。 */
export class PermissionStatusDto {
  @ApiProperty({ type: String, example: '1', description: '待变更权限 ID。' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
