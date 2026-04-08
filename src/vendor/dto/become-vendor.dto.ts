import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BecomeVendorDto {
  @ApiPropertyOptional({ example: 'I want to sell on Zutaonline' })
  @IsOptional()
  @IsString()
  reason?: string;
}