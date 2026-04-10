import { PartialType } from '@nestjs/swagger';
import { CreatePickupLocationDto } from './create-pickup-location.dto';

export class UpdatePickupLocationDto extends PartialType(
  CreatePickupLocationDto,
) {}