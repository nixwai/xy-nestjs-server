import { ApiProperty } from '@nestjs/swagger';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';

/** 权限目录公开信息。 */
export class PermissionResponseDto implements Omit<PermissionRecord, 'id'> {
  @ApiProperty({ type: String, description: '权限 ID。', example: '1' })
  id!: string;

  @ApiProperty({ type: String, description: '权限唯一编码。', example: 'booking.read' })
  code!: string;

  @ApiProperty({ type: String, description: '权限名称。', example: '查看预约' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, description: '权限描述。' })
  description!: string | null;

  @ApiProperty({ type: String, description: '权限分类。', example: '预约' })
  category!: string;

  @ApiProperty({ type: Boolean, description: '是否允许绑定给普通角色。' })
  isAssignable!: boolean;

  @ApiProperty({ type: Boolean, description: '是否属于受保护权限。' })
  isProtected!: boolean;

  @ApiProperty({ type: Boolean, description: '是否启用。' })
  isActive!: boolean;
}
