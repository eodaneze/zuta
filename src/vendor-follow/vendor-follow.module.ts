import { Module } from '@nestjs/common';
import { VendorFollowController } from './vendor-follow.controller';
import { VendorFollowService } from './vendor-follow.service';

@Module({
  controllers: [VendorFollowController],
  providers: [VendorFollowService]
})
export class VendorFollowModule {}
