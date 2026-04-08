import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorStatus } from '../../vendor/enums/vendor-status.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class AdminQueryVendorStoreDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VendorStatus })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiPropertyOptional({ example: 'gadget' })
  @IsOptional()
  @IsString()
  search?: string;
}