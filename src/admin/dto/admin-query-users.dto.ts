import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class AdminQueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'daniel' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}