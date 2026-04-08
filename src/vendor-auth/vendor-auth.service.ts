import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { TokenService } from '../token/token.service';
import { TokenType } from '../common/enums/token-type.enum';
import { generateFourDigitCode } from '../common/utils/code.utils';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class VendorAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: VendorRegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      roles: [UserRole.CUSTOMER, UserRole.VENDOR],
      isVendor: true,
    });

    const code = generateFourDigitCode();

    await this.tokenService.createToken({
      userId: user._id.toString(),
      token: code,
      type: TokenType.EMAIL_VERIFICATION,
      expiresInMinutes: Number(
        this.configService.get<string>(
          'EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES',
        ) || 10,
      ),
    });

    await this.mailService.sendVerificationEmail(user.email, {
      name: user.fullName,
      code,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user._id,
      email: user.email,
      roles: user.roles,
      isVendor: user.isVendor,
    });

    return {
      message:
        'Vendor account created successfully. A verification code has been sent to your email',
      data: {
        accessToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          roles: user.roles,
          isVendor: user.isVendor,
          isEmailVerified: user.isEmailVerified,
          hasCompletedVendorOnboarding: user.hasCompletedVendorOnboarding,
        },
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVendor || !user.roles.includes(UserRole.VENDOR)) {
      throw new UnauthorizedException('This account is not a vendor account');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user._id,
      email: user.email,
      roles: user.roles,
      isVendor: user.isVendor,
    });

    return {
      message: 'Vendor login successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          roles: user.roles,
          isVendor: user.isVendor,
          isEmailVerified: user.isEmailVerified,
          hasCompletedVendorOnboarding: user.hasCompletedVendorOnboarding,
        },
      },
    };
  }
}