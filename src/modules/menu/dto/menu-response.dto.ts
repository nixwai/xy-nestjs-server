import { ApiProperty } from '@nestjs/swagger';
export class MenuResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String, nullable: true }) parentId!: string | null;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String }) path!: string;
  @ApiProperty({ type: String, nullable: true }) icon!: string | null;
  @ApiProperty({ type: Number }) order!: number;
  @ApiProperty({ type: String, nullable: true }) permissionCode!: string | null;
  @ApiProperty({ type: Boolean }) isActive!: boolean;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) deletedAt!: Date | null;
}
