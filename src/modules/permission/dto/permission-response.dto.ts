import { ApiProperty } from '@nestjs/swagger';
import { HttpMethod, PermissionResource } from '#/modules/authorization/enums/index.js';

/** 权限目录公开信息。 */
export class PermissionResponseDto {
  @ApiProperty({ type: String, description: '权限 ID。', example: '1' })
  id!: string;

  @ApiProperty({
    type: String,
    description: '权限唯一编码。',
    example: 'admin.list'
  })
  code!: string;

  @ApiProperty({
    enum: PermissionResource,
    description: '权限所属资源。',
    example: PermissionResource.ADMIN
  })
  resource!: PermissionResource;

  @ApiProperty({
    enum: HttpMethod,
    description: '权限对应的 HTTP 方法。',
    example: HttpMethod.GET
  })
  method!: HttpMethod;

  @ApiProperty({
    type: String,
    description: '权限名称。',
    example: '查询管理员列表'
  })
  name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '权限描述。未填写时为 null。',
    example: '查询所有未删除的管理员。'
  })
  description!: string | null;

  @ApiProperty({ type: Boolean, description: '是否启用。', example: true })
  isActive!: boolean;
}
