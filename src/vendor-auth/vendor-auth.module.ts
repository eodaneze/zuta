import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../token/token.module';
import { MailModule } from '../mail/mail.module';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';

@Module({
  imports: [
    UsersModule,
    TokenModule,
    MailModule,
    ConfigModule,
    JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.getOrThrow<string>('JWT_SECRET'),
            signOptions: { expiresIn: '1d' },
          }),
    }),
  ],
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
  exports: [VendorAuthService],
})
export class VendorAuthModule {}