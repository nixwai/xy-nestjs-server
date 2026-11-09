import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAssetFolderDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}

export class UpdateAssetFolderDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  name!: string;
}
