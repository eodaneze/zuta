import { Module } from '@nestjs/common';
import { VendorAuthService } from './vendor-auth.service';
import { VendorAuthController } from './vendor-auth.controller';

@Module({
  providers: [VendorAuthService],
  controllers: [VendorAuthController]
})
export class VendorAuthModule {}
