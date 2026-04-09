import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorFollowController } from './vendor-follow.controller';
import { VendorFollowService } from './vendor-follow.service';
import {
  VendorFollow,
  VendorFollowSchema,
} from './schemas/vendor-follow.schema';
import {
  VendorProfile,
  VendorProfileSchema,
} from '../vendor/schemas/vendor-profile.schema';
import { NotificationModule } from 'src/notification/notification.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorFollow.name, schema: VendorFollowSchema },
      { name: VendorProfile.name, schema: VendorProfileSchema },
    ]),
     NotificationModule,
     UsersModule,
  ],
  controllers: [VendorFollowController],
  providers: [VendorFollowService],
  exports: [VendorFollowService],
})
export class VendorFollowModule {}