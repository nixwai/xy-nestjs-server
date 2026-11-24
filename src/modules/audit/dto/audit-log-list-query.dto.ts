import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { createValidationMessages } from '#/common/constants/index.js';
import { CursorPageQueryDto } from '#/common/dto/index.js';

const identifierValidation = createValidationMessages('标识');
const actionValidation = createValidationMessages('操作编码');
const resourceTypeValidation = createValidationMessages('资源类型');
const dateValidation = createValidationMessages('时间');
/** 审计日志游标分页查询参数。 */
export class AuditLogListQueryDto extends CursorPageQueryDto {
  /** 按操作者管理员 ID 搜索。 */
  @ApiPropertyOptional({ type: String, maxLength: 64, description: '按操作者管理员 ID 搜索。' })
  @IsOptional()
  @IsString({ message: identifierValidation.isString })
  @MaxLength(64, { message: identifierValidation.maxLength(64) })
  actorAdminId?: string;

  /** 按目标资源 ID 搜索。 */
  @ApiPropertyOptional({ type: String, maxLength: 64, description: '按目标资源 ID 搜索。' })
  @IsOptional()
  @IsString({ message: identifierValidation.isString })
  @MaxLength(64, { message: identifierValidation.maxLength(64) })
  targetId?: string;

  /** 按操作编码精确筛选。 */
  @ApiPropertyOptional({ type: String, maxLength: 64, description: '按操作编码精确筛选。' })
  @IsOptional()
  @IsString({ message: actionValidation.isString })
  @MaxLength(64, { message: actionValidation.maxLength(64) })
  action?: string;

  /** 按资源类型精确筛选。 */
  @ApiPropertyOptional({ type: String, maxLength: 64, description: '按资源类型精确筛选。' })
  @IsOptional()
  @IsString({ message: resourceTypeValidation.isString })
  @MaxLength(64, { message: resourceTypeValidation.maxLength(64) })
  resourceType?: string;

  /** 按操作结果筛选。 */
  @ApiPropertyOptional({ type: Boolean, description: '是否只返回成功或失败记录。' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  succeeded?: boolean;

  /** 查询起始时间，包含该时刻。 */
  @ApiPropertyOptional({ type: String, format: 'date-time', description: '查询起始时间，包含该时刻。' })
  @IsOptional()
  @IsISO8601({}, { message: `${dateValidation.isString}，格式应为 ISO 时间` })
  createdFrom?: string;

  /** 查询结束时间，包含该时刻。 */
  @ApiPropertyOptional({ type: String, format: 'date-time', description: '查询结束时间，包含该时刻。' })
  @IsOptional()
  @IsISO8601({}, { message: `${dateValidation.isString}，格式应为 ISO 时间` })
  createdTo?: string;
}
