import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** 权限启停请求。 */
export class PermissionStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;
}
