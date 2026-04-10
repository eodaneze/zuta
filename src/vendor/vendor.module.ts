import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import {
  VendorProfile,
  VendorProfileSchema,
} from './schemas/vendor-profile.schema';
import { VendorKyc, VendorKycSchema } from './schemas/vendor-kyc.schema';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MailModule } from '../mail/mail.module';
import { VendorFollowModule } from '../vendor-follow/vendor-follow.module';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import {
  VendorFollow,
  VendorFollowSchema,
} from '../vendor-follow/schemas/vendor-follow.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorProfile.name, schema: VendorProfileSchema },
      { name: VendorKyc.name, schema: VendorKycSchema },
      { name: Product.name, schema: ProductSchema },
      { name: VendorFollow.name, schema: VendorFollowSchema },
    ]),
    UsersModule,
    UploadsModule,
    CloudinaryModule,
    MailModule,
    VendorFollowModule,
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}