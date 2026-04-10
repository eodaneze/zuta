import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import {
  PickupLocation,
  PickupLocationSchema,
} from './schemas/pickup-location.schema';
import {
  ProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import {
  DeliverySettings,
  DeliverySettingsSchema,
} from './schemas/delivery-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PickupLocation.name, schema: PickupLocationSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: DeliverySettings.name, schema: DeliverySettingsSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}