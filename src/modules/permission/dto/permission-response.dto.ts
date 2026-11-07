import { ApiProperty } from '@nestjs/swagger';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';
/** 权限目录公开信息。 */
export class PermissionResponseDto implements Omit<PermissionRecord, 'id'> {
  /** 唯一标识。 */
  @ApiProperty({ type: String, description: '权限 ID。', example: '1' })
  id!: string;
  /** 业务编码。 */
  @ApiProperty({ type: String, description: '权限编码。', example: 'resource.read' })
  code!: string;
  /** 名称。 */
  @ApiProperty({ type: String, description: '权限名称。', example: '查看资源' })
  name!: string;
  /** 资源描述。 */
  @ApiProperty({ type: String, nullable: true, description: '权限描述。' })
  description!: string | null;
  /** 业务分类。 */
  @ApiProperty({ type: String, description: '权限分类。', example: '资源' })
  category!: string;
  /** 权限是否允许分配给角色。 */
  @ApiProperty({ type: Boolean, description: '是否允许绑定给普通角色。' })
  isAssignable!: boolean;
  /** 角色是否受系统保护。 */
  @ApiProperty({ type: Boolean, description: '是否属于受保护权限。' })
  isProtected!: boolean;
  /** 是否启用。 */
  @ApiProperty({ type: Boolean, description: '是否启用。' })
  isActive!: boolean;
}
