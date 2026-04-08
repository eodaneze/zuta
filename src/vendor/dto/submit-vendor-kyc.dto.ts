import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GovernmentIdType } from '../enums/government-id-type.enum';

export class SubmitVendorKycDto {
  @ApiProperty({ enum: GovernmentIdType, example: GovernmentIdType.NIN })
  @IsEnum(GovernmentIdType)
  governmentIdType!: GovernmentIdType;
}