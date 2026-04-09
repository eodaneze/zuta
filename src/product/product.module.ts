import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schemas/product.schema';
import {
  VendorProfile,
  VendorProfileSchema,
} from '../vendor/schemas/vendor-profile.schema';
import { VendorKyc, VendorKycSchema } from '../vendor/schemas/vendor-kyc.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: VendorProfile.name, schema: VendorProfileSchema },
      { name: VendorKyc.name, schema: VendorKycSchema },
    ]),
    UploadsModule,
    CloudinaryModule,
    MailModule,
    NotificationModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}