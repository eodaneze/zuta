import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TokenModule } from './token/token.module';
import { MailModule } from './mail/mail.module';
import { VendorModule } from './vendor/vendor.module';
import { UploadsModule } from './uploads/uploads.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { AdminModule } from './admin/admin.module';
import { ProductModule } from './product/product.module';
import { NotificationModule } from './notification/notification.module';
import { VendorFollowModule } from './vendor-follow/vendor-follow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TokenModule,
    MailModule,
    CloudinaryModule,
    UploadsModule,
    VendorAuthModule,
    VendorModule,
    AdminModule,
    ProductModule,
    NotificationModule,
    VendorFollowModule,
  ],
})
export class AppModule {}