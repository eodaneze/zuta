import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePickupLocationDto {

  @ApiProperty({example: 'John Deo'})
  @IsString()
  contactPerson!: string;

  @ApiProperty({example: '0000000000000'})
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'Port Harcourt Pickup Hub' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '12 Aba Road, Port Harcourt' })
  @IsString()
  address!: string;

  @ApiPropertyOptional({ example: 'Port Harcourt' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Rivers' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;
}