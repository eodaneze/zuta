import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AdminReviewDto {
  @ApiPropertyOptional({ example: 'Document was blurry and unreadable' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}