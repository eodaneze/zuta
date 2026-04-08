import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorStatus } from '../../vendor/enums/vendor-status.enum';

export class AdminQueryVendorKycDto {
  @ApiPropertyOptional({ enum: VendorStatus })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiPropertyOptional({ example: 'daniel@example.com' })
  @IsOptional()
  @IsString()
  search?: string;
}