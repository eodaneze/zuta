import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
  @ApiPropertyOptional({ example: 'XL' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 13 Pro' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Clean UK used iPhone 13 Pro' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Phones' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: ['iphone', 'apple', 'smartphone'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 450000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 430000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPrice?: number | null;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ example: 'SPM-IP13P-001' })
  @IsString()
  sku!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasVariants?: boolean;

  @ApiPropertyOptional({
    type: [CreateProductVariantDto],
    example: [
      { size: '64GB', color: 'Black', price: 450000, quantity: 3 },
      { size: '128GB', color: 'Silver', price: 500000, quantity: 5 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}