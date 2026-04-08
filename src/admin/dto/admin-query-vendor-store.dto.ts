import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorStatus } from '../../vendor/enums/vendor-status.enum';

export class AdminQueryVendorStoreDto {
  @ApiPropertyOptional({ enum: VendorStatus })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiPropertyOptional({ example: 'gadget' })
  @IsOptional()
  @IsString()
  search?: string;
}