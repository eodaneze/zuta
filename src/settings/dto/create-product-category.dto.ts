import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Phones, gadgets, accessories and devices' })
  @IsOptional()
  @IsString()
  description?: string;
}