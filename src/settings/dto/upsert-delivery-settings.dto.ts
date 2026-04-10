import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpsertDeliverySettingsDto {
  @ApiProperty({ example: 2500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingFee!: number;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  homeDeliveryFee!: number;
}