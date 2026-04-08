import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVendorProfileDto {
  @ApiProperty({ example: 'Daniel Gadgets Hub' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  storeName!: string;

  @ApiProperty({ example: 'Trusted gadgets and accessories store' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  storeDescription!: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  storeCategory!: string;
}