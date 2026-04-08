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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorProfile.name, schema: VendorProfileSchema },
      { name: VendorKyc.name, schema: VendorKycSchema },
    ]),
    UsersModule,
    UploadsModule,
    CloudinaryModule,
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}