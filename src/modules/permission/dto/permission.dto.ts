import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
/** 权限状态请求。 */
export class PermissionStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() id!: string;
}
