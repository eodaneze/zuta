import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AdminProductReviewDto {
  @ApiPropertyOptional({ example: 'Product images are too blurry' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}